from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from accounts.models import ShopperProfile
from audit.models import AuditLog
from audit.services import log_action
from common.exceptions import AppError, NotFoundError
from common.permissions import IsMerchantAdmin
from common.response import success
from common.tenancy import get_merchant_from_user
from catalog.models import Category, Product
from fraud.models import FraudConfiguration, RiskScoreEvent
from notifications.services import create_notification
from orders.models import Order
from returns.models import ReturnEvent, ReturnRequest, ReviewDecision
from returns.serializers import ReturnRequestSerializer
from verification.models import VerificationEvent
from .models import DeliveryAgent, SelfTuningSuggestion
from .serializers import (
    AdminCategorySerializer,
    AdminProductSerializer,
    AdminProductWriteSerializer,
    FraudConfigSerializer,
    ReviewReturnSerializer,
    ShopperProfileSerializer,
)


class MerchantDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsMerchantAdmin]

    def get(self, request):
        from django.db.models import Sum
        merchant = get_merchant_from_user(request.user)
        merchant_orders = Order.objects.filter(merchant=merchant)
        total_orders = merchant_orders.count()
        total_revenue = merchant_orders.filter(~Q(status="Cancelled")).aggregate(total=Sum("total"))["total"] or 0
        
        flagged = ReturnRequest.objects.filter(merchant=merchant, status="manual_review")
        flagged_cases = flagged.count()
        all_returns = ReturnRequest.objects.filter(merchant=merchant).count()
        return_rate = round((all_returns / total_orders * 100), 1) if total_orders > 0 else 0.0

        pending_review = merchant_orders.filter(status="Review").count() + flagged_cases
        recent_flagged = flagged.select_related("order").order_by("-created_at")[:5]
        
        return success(
            {
                "totalOrders": total_orders,
                "totalRevenue": float(total_revenue),
                "flaggedCases": flagged_cases,
                "pendingReview": pending_review,
                "returnRate": return_rate,
                "riskTier": "Low" if return_rate < 10 else "Medium" if return_rate < 25 else "High",
                "recentFlagged": ReturnRequestSerializer(recent_flagged, many=True).data,
            }
        )


class MerchantOrdersView(APIView):
    permission_classes = [IsAuthenticated, IsMerchantAdmin]

    def get(self, request):
        merchant = get_merchant_from_user(request.user)
        orders = Order.objects.filter(merchant=merchant).prefetch_related("items").order_by("-created_at")
        from orders.serializers import OrderListSerializer

        return success(OrderListSerializer(orders, many=True).data)


class MerchantCustomersView(APIView):
    permission_classes = [IsAuthenticated, IsMerchantAdmin]

    def get(self, request):
        merchant = get_merchant_from_user(request.user)
        profiles = (
            ShopperProfile.objects.filter(Q(merchant=merchant) | Q(user__orders__merchant=merchant))
            .select_related("user")
            .distinct()
            .order_by("-joined_at")
        )
        return success(ShopperProfileSerializer(profiles, many=True).data)


class MerchantFlaggedCasesView(APIView):
    permission_classes = [IsAuthenticated, IsMerchantAdmin]

    def get(self, request):
        merchant = get_merchant_from_user(request.user)
        cases = (
            ReturnRequest.objects.filter(merchant=merchant, status="manual_review")
            .select_related("order")
            .prefetch_related("return_lines", "timeline")
            .order_by("-created_at")
        )
        return success(ReturnRequestSerializer(cases, many=True).data)


class MerchantAuditLogView(APIView):
    permission_classes = [IsAuthenticated, IsMerchantAdmin]

    def get(self, request):
        merchant = get_merchant_from_user(request.user)
        from audit.serializers import AuditLogSerializer

        logs = AuditLog.objects.filter(merchant=merchant).order_by("-created_at")
        return success(AuditLogSerializer(logs, many=True).data)


class ReviewReturnView(APIView):
    permission_classes = [IsAuthenticated, IsMerchantAdmin]

    def post(self, request, pk):
        merchant = get_merchant_from_user(request.user)
        serializer = ReviewReturnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data["action"]
        notes = serializer.validated_data.get("notes", "")

        return_request = ReturnRequest.objects.filter(merchant=merchant, pk=pk).select_related("order").first()
        if return_request is None:
            raise NotFoundError("Return not found.")

        return_request.status = "approved" if action == "approve" else "rejected"
        return_request.outcome = "legitimate_return" if action == "approve" else "confirmed_fraud"
        return_request.reviewed_by = request.user.email
        return_request.reviewed_at = timezone.now()
        return_request.save()

        ReviewDecision.objects.create(
            return_request=return_request,
            action=action,
            reviewed_by=request.user.email,
            notes=notes,
        )
        ReturnEvent.objects.create(
            return_request=return_request,
            label="Approved" if action == "approve" else "Rejected",
        )
        log_action(
            merchant=merchant,
            actor=request.user.email,
            action=action,
            target=f"Return {return_request.order.order_number}",
            notes=notes,
        )
        create_notification(
            user=return_request.user,
            type_=f"return_{'approved' if action == 'approve' else 'rejected'}",
            title="Return approved" if action == "approve" else "Return rejected",
            body=(
                f"Your return for {return_request.order.order_number} was "
                f"{'approved' if action == 'approve' else 'rejected'} after review."
            ),
            channel="in_app" if action == "approve" else "sms",
        )
        return success(ReturnRequestSerializer(return_request).data)


class CustomerRiskProfileView(APIView):
    permission_classes = [IsAuthenticated, IsMerchantAdmin]

    def get(self, request, customer_id):
        merchant = get_merchant_from_user(request.user)
        profile = ShopperProfile.objects.filter(merchant=merchant, user_id=customer_id).select_related("user").first()
        if profile is None:
            raise NotFoundError("Customer not found.")
        customer = profile.user
        orders = Order.objects.filter(merchant=merchant, user=customer).prefetch_related("items")
        returns = ReturnRequest.objects.filter(merchant=merchant, user=customer)
        scoring = RiskScoreEvent.objects.filter(merchant=merchant, customer=customer)
        verification = VerificationEvent.objects.filter(customer=customer)

        from orders.serializers import OrderListSerializer

        return success(
            {
                "customer": ShopperProfileSerializer(profile).data,
                "orders": OrderListSerializer(orders, many=True).data,
                "returns": ReturnRequestSerializer(returns, many=True).data,
                "scoring": [
                    {
                        "id": s.id,
                        "customer_id": s.customer_id,
                        "customer_name": s.customer.name,
                        "score": s.score,
                        "tier": s.tier,
                        "rule_version": s.rule_version,
                        "signals": s.signals,
                        "created_at": s.created_at.isoformat(),
                    }
                    for s in scoring
                ],
                "verification": [
                    {
                        "id": v.id,
                        "customer_id": v.customer_id,
                        "method": v.method,
                        "status": v.status,
                        "confidence": v.confidence,
                        "created_at": v.created_at.isoformat(),
                    }
                    for v in verification
                ],
            }
        )


class FraudConfigView(APIView):
    permission_classes = [IsAuthenticated, IsMerchantAdmin]

    def get(self, request):
        merchant = get_merchant_from_user(request.user)
        config, _ = FraudConfiguration.objects.get_or_create(
            merchant=merchant,
            defaults={
                "weights": {
                    "return_frequency": 0.32,
                    "cod_refusal": 0.18,
                    "device_reuse": 0.22,
                    "address_mismatch": 0.12,
                    "seasonal_signal": 0.16,
                },
                "thresholds": {"low_max": 34, "medium_max": 64, "high_min": 65},
            },
        )
        return success(FraudConfigSerializer(config).data)

    def patch(self, request):
        merchant = get_merchant_from_user(request.user)
        config, _ = FraudConfiguration.objects.get_or_create(merchant=merchant)
        serializer = FraudConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_action(
            merchant=merchant,
            actor=request.user.email,
            action="updated",
            target="Fraud rule configuration",
            notes="Rule weights or thresholds changed.",
        )
        return success(FraudConfigSerializer(config).data)


class DeliveryAgentsView(APIView):
    """Delivery-agent risk analysis (Section 16)."""

    permission_classes = [IsAuthenticated, IsMerchantAdmin]

    def get(self, request):
        merchant = get_merchant_from_user(request.user)
        agents = DeliveryAgent.objects.filter(merchant=merchant).order_by("name")
        return success(
            [
                {
                    "id": a.id,
                    "merchant_id": a.merchant_id,
                    "name": a.name,
                    "route": a.route,
                    "pincode": a.pincode,
                    "total_deliveries": a.total_deliveries,
                    "total_returns_handled": a.total_returns_handled,
                    "return_rate": a.return_rate,
                    "expected_return_rate": a.expected_return_rate,
                    "flagged_return_count": a.flagged_return_count,
                    "risk_flag": a.risk_flag,
                }
                for a in agents
            ]
        )


class ApplySelfTuningView(APIView):
    """Apply a self-tuning suggestion to the fraud configuration.

    The PDF (Section 17) requires human review before thresholds change, and
    every decision must be traceable to the rule set that produced it. This
    endpoint persists the approved weight and logs the action.
    """

    permission_classes = [IsAuthenticated, IsMerchantAdmin]

    def post(self, request, pk):
        merchant = get_merchant_from_user(request.user)
        suggestion = SelfTuningSuggestion.objects.filter(merchant=merchant, pk=pk).first()
        if suggestion is None:
            raise NotFoundError("Suggestion not found.")

        config, _ = FraudConfiguration.objects.get_or_create(merchant=merchant)
        weights = dict(config.weights or {})
        if suggestion.rule in weights:
            weights[suggestion.rule] = float(suggestion.suggested_value)
        config.weights = weights
        config.save(update_fields=["weights"])

        suggestion.status = "applied"
        suggestion.save(update_fields=["status"])

        log_action(
            merchant=merchant,
            actor=request.user.email,
            action="applied",
            target=f"Self-tuning suggestion: {suggestion.label}",
            notes=f"Changed from {suggestion.current_value} to {suggestion.suggested_value}.",
        )

        return success(
            {
                "id": suggestion.id,
                "rule": suggestion.rule,
                "label": suggestion.label,
                "current_value": suggestion.current_value,
                "suggested_value": suggestion.suggested_value,
                "reason": suggestion.reason,
                "confidence": suggestion.confidence,
                "sample_size": suggestion.sample_size,
                "window_days": suggestion.window_days,
                "status": suggestion.status,
            }
        )


class MerchantProductsView(APIView):
    permission_classes = [IsAuthenticated, IsMerchantAdmin]

    def get(self, request):
        merchant = get_merchant_from_user(request.user)
        qs = Product.objects.filter(merchant=merchant).select_related("category")
        category_id = request.query_params.get("category_id")
        query = request.query_params.get("query")
        status_filter = request.query_params.get("status")

        if category_id and category_id != "all":
            qs = qs.filter(category_id=category_id)
        if query:
            qs = qs.filter(Q(name__icontains=query) | Q(description__icontains=query))
        if status_filter == "active":
            qs = qs.filter(is_active=True)
        elif status_filter == "inactive":
            qs = qs.filter(is_active=False)
        elif status_filter == "out_of_stock":
            qs = qs.filter(stock=0)
        elif status_filter == "low_stock":
            qs = qs.filter(stock__gt=0, stock__lte=5)

        return success(AdminProductSerializer(qs.order_by("-created_at"), many=True).data)

    def post(self, request):
        merchant = get_merchant_from_user(request.user)
        serializer = AdminProductWriteSerializer(data=request.data, context={"merchant": merchant})
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        category_id = validated.pop("category_id", None)
        category = Category.objects.filter(id=category_id).first() if category_id else None

        product = Product.objects.create(
            merchant=merchant,
            category=category,
            **validated,
        )

        log_action(
            merchant=merchant,
            actor=request.user.email,
            action="created",
            target=f"Product: {product.name}",
            notes=f"Created with price ₹{product.price} and stock {product.stock}.",
        )

        return success(AdminProductSerializer(product).data, status=status.HTTP_201_CREATED)


class MerchantProductDetailView(APIView):
    permission_classes = [IsAuthenticated, IsMerchantAdmin]

    def get(self, request, pk):
        merchant = get_merchant_from_user(request.user)
        product = Product.objects.filter(merchant=merchant, pk=pk).select_related("category").first()
        if product is None:
            raise NotFoundError("Product not found.")
        return success(AdminProductSerializer(product).data)

    def patch(self, request, pk):
        merchant = get_merchant_from_user(request.user)
        product = Product.objects.filter(merchant=merchant, pk=pk).first()
        if product is None:
            raise NotFoundError("Product not found.")

        serializer = AdminProductWriteSerializer(product, data=request.data, partial=True, context={"merchant": merchant})
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        if "category_id" in validated:
            cat_id = validated.pop("category_id")
            product.category = Category.objects.filter(id=cat_id).first() if cat_id else None

        for attr, val in validated.items():
            setattr(product, attr, val)

        product.save()

        log_action(
            merchant=merchant,
            actor=request.user.email,
            action="updated",
            target=f"Product: {product.name}",
            notes=f"Updated product details.",
        )

        return success(AdminProductSerializer(product).data)

    def delete(self, request, pk):
        merchant = get_merchant_from_user(request.user)
        product = Product.objects.filter(merchant=merchant, pk=pk).first()
        if product is None:
            raise NotFoundError("Product not found.")

        name = product.name
        product.delete()

        log_action(
            merchant=merchant,
            actor=request.user.email,
            action="deleted",
            target=f"Product: {name}",
            notes="Deleted product from catalog.",
        )

        return success({"deleted": True, "id": pk})


class MerchantCategoriesView(APIView):
    permission_classes = [IsAuthenticated, IsMerchantAdmin]

    def get(self, request):
        merchant = get_merchant_from_user(request.user)
        categories = Category.objects.filter(merchant=merchant)
        if not categories.exists():
            defaults = (
                ("Daily Wear", "Everyday tops, shirts and basics"),
                ("Electronics", "Gadgets and accessories"),
                ("Ethnic Wear", "Kurtas, sarees, lehengas and festive wear"),
                ("Home", "Home and living essentials"),
            )
            for name, description in defaults:
                slug = slugify(name)
                # Use slug-only IDs (no merchant PK) so category IDs are
                # stable and predictable regardless of the merchant's DB row id.
                Category.objects.get_or_create(
                    merchant=merchant,
                    name=name,
                    defaults={"description": description, "slug": slug, "id": f"cat_{slug}"},
                )
            categories = Category.objects.filter(merchant=merchant)
        return success(AdminCategorySerializer(categories, many=True).data)

    def post(self, request):
        merchant = get_merchant_from_user(request.user)
        name = request.data.get("name", "").strip()
        if not name:
            raise AppError("Category name is required.")

        slug = slugify(name)
        category, created = Category.objects.get_or_create(
            merchant=merchant,
            name=name,
            defaults={
                "description": request.data.get("description", ""),
                "slug": slug,
                "id": f"cat_{slug}",
            },
        )
        return success(AdminCategorySerializer(category).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

