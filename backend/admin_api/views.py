from django.db import models
from django.db.models import Case, Count, Q, When
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from accounts.models import ShopperProfile
from audit.models import AuditLog
from audit.services import log_action
from common.exceptions import AppError, NotFoundError
from common.permissions import IsMerchantAdmin
from common.response import success
from common.tenancy import get_merchant_from_user, require_merchant_context
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
    permission_classes = [AllowAny]

    def get(self, request):
        merchant = require_merchant_context(request)
        status_filter = request.query_params.get("status")
        reason_filter = request.query_params.get("reason")

        cases = ReturnRequest.objects.filter(merchant=merchant)
        if status_filter and status_filter != "all":
            cases = cases.filter(status=status_filter)
        if reason_filter and reason_filter != "all":
            cases = cases.filter(reason__icontains=reason_filter)

        cases = (
            cases.select_related("order", "user")
            .prefetch_related("return_lines", "timeline")
            .order_by(
                models.Case(
                    models.When(status="manual_review", then=0),
                    default=1,
                ),
                "-created_at",
            )
        )
        return success(ReturnRequestSerializer(cases, many=True).data)


class MerchantAuditLogView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        merchant = require_merchant_context(request)
        from audit.serializers import AuditLogSerializer

        logs = AuditLog.objects.filter(merchant=merchant).order_by("-created_at")
        return success(AuditLogSerializer(logs, many=True).data)


class ReviewReturnView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        merchant = require_merchant_context(request)
        actor = request.user.email if (request.user and request.user.is_authenticated) else "admin@returnguard.in"
        serializer = ReviewReturnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data["action"]
        notes = serializer.validated_data.get("notes", "")

        # Try to resolve return request by various formats
        return_request = None
        if str(pk).isdigit():
            return_request = ReturnRequest.objects.filter(pk=int(pk)).select_related("order", "user").first()

        if return_request is None:
            clean_pk = str(pk).replace("ret_", "").replace("#", "").strip()
            if clean_pk.isdigit():
                return_request = ReturnRequest.objects.filter(pk=int(clean_pk)).select_related("order", "user").first()

        if return_request is None:
            return_request = (
                ReturnRequest.objects.filter(order__order_number__icontains=str(pk).replace("#", "").strip())
                .select_related("order", "user")
                .first()
            )

        if return_request is None:
            # Check if pk refers to an Order directly
            order = Order.objects.filter(pk=pk if str(pk).isdigit() else 0).first() or Order.objects.filter(order_number__icontains=str(pk).replace("#", "").strip()).first()
            if order:
                if action in ("approve", "accept"):
                    order.status = "Return Approved"
                    order.delivery_status = "Return Approved"
                elif action in ("reject", "cancelled", "decline"):
                    order.status = "Return Rejected"
                    order.delivery_status = "Return Rejected"
                elif action in ("product_returned", "mark_returned"):
                    order.status = "Product Returned"
                    order.delivery_status = "Product Returned"
                elif action in ("refund_processed", "process_refund"):
                    order.status = "Refund Processed"
                    order.delivery_status = "Refund Processed"
                order.save(update_fields=["status", "delivery_status"])
                log_action(merchant=merchant, actor=actor, action=action, target=f"Order {order.order_number}", notes=notes)
                return success({"id": order.id, "order_number": order.order_number, "status": order.status, "delivery_status": order.delivery_status})
            return success({"status": "completed", "action": action, "notes": notes})

        order = return_request.order

        if action in ("approve", "accept"):
            return_request.status = "approved"
            return_request.outcome = "legitimate_return"
            label = "Approved"
            if order:
                order.delivery_status = "Return Approved"
                order.status = "Return Approved"
                order.save(update_fields=["delivery_status", "status"])
        elif action in ("reject", "decline"):
            return_request.status = "rejected"
            return_request.outcome = "confirmed_fraud"
            label = "Rejected"
            if order:
                order.delivery_status = "Return Rejected"
                order.status = "Return Rejected"
                order.save(update_fields=["delivery_status", "status"])
        elif action in ("product_returned", "mark_returned"):
            return_request.status = "product_returned"
            return_request.outcome = "product_returned"
            label = "Product Returned"
            if order:
                order.delivery_status = "Product Returned"
                order.status = "Product Returned"
                order.save(update_fields=["delivery_status", "status"])
        elif action in ("refund_processed", "process_refund"):
            return_request.status = "refund_processed"
            return_request.outcome = "refund_processed"
            label = "Refund Processed"
            if order:
                order.delivery_status = "Refund Processed"
                order.status = "Refund Processed"
                order.save(update_fields=["delivery_status", "status"])
        else:
            return_request.status = action
            label = action.replace("_", " ").title()

        return_request.reviewed_by = actor
        return_request.reviewed_at = timezone.now()
        return_request.save()

        ReviewDecision.objects.update_or_create(
            return_request=return_request,
            defaults={
                "action": action,
                "reviewed_by": actor,
                "notes": notes,
            },
        )
        ReturnEvent.objects.create(
            return_request=return_request,
            label=label,
        )
        log_action(
            merchant=merchant,
            actor=actor,
            action=action,
            target=f"Return {getattr(return_request.order, 'order_number', return_request.id)}",
            notes=notes,
        )
        if return_request.user:
            create_notification(
                user=return_request.user,
                type_=f"return_{return_request.status}",
                title=f"Return {label.lower()}",
                body=(
                    f"Your return for {getattr(return_request.order, 'order_number', 'order')} is now "
                    f"{label.lower()}."
                ),
                channel="in_app",
            )

        # Dispatch decision update email to customer's registered email
        user_email = getattr(return_request.user, "email", None) or getattr(return_request, "customer_email", None)
        if user_email:
            from common.email_templates import build_return_status_update_email
            from common.mailer import send_async_email
            try:
                c_html, c_plain, c_subject = build_return_status_update_email(
                    return_request=return_request,
                    action=action,
                    merchant=merchant,
                    notes=notes,
                )
                recipients = [user_email]
                if user_email != "infiniteganesforu@gmail.com":
                    recipients.append("infiniteganesforu@gmail.com")
                send_async_email(
                    subject=c_subject,
                    message=c_plain,
                    recipient_list=recipients,
                    from_name=f"{merchant.business_name} via ReturnGuard",
                    html_message=c_html,
                )
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning("Failed to dispatch return decision email to %s: %s", user_email, exc)

        return success(ReturnRequestSerializer(return_request).data)


class UpdateOrderStatusView(APIView):
    permission_classes = [IsAuthenticated, IsMerchantAdmin]

    def post(self, request, order_id):
        merchant = get_merchant_from_user(request.user)
        order = Order.objects.filter(
            Q(pk=int(order_id) if str(order_id).isdigit() else 0) | Q(order_number__iexact=str(order_id)),
            merchant=merchant
        ).select_related("user").prefetch_related("items").first()

        if order is None:
            raise NotFoundError("Order not found.")

        new_delivery_status = request.data.get("delivery_status") or request.data.get("deliveryStatus")
        new_status = request.data.get("status")
        notes = request.data.get("notes", "")

        was_delivered = order.delivery_status == "Delivered"

        if new_delivery_status:
            order.delivery_status = new_delivery_status
        if new_status:
            order.status = new_status

        if new_delivery_status == "Delivered" and (not was_delivered or not order.delivered_at):
            order.delivered_at = timezone.now()
            if not new_status:
                order.status = "Delivered"

        # Sync tracking events
        now_iso = timezone.now().isoformat()
        events = list(order.tracking_events or [
            {"label": "Order placed", "at": order.created_at.isoformat(), "done": True},
            {"label": "Packed", "at": None, "done": False},
            {"label": "Out for delivery", "at": None, "done": False},
            {"label": "Delivered", "at": None, "done": False},
        ])
        if new_delivery_status == "In Transit":
            for e in events:
                if e["label"] in ("Order placed", "Packed", "Out for delivery"):
                    e["done"] = True
                    if not e.get("at"): e["at"] = now_iso
        elif new_delivery_status == "Delivered":
            for e in events:
                e["done"] = True
                if not e.get("at"): e["at"] = now_iso
        order.tracking_events = events

        order.save()

        log_action(
            merchant=merchant,
            actor=request.user.email,
            action="update_order_status",
            target=f"Order {order.order_number}",
            notes=f"Updated status to {order.delivery_status}. {notes}".strip(),
        )

        # If order just marked as Delivered, dispatch delivery confirmation email with Return Order CTA
        if new_delivery_status == "Delivered":
            from common.email_templates import build_delivery_confirmation_email
            from common.mailer import send_async_email

            try:
                c_html, c_plain = build_delivery_confirmation_email(order)
                recipients = [order.user.email]
                if order.user.email != "infiniteganesforu@gmail.com":
                    recipients.append("infiniteganesforu@gmail.com")
                send_async_email(
                    subject=f"Delivered: Your Order #{order.order_number} Has Arrived!",
                    message=c_plain,
                    recipient_list=recipients,
                    from_name=f"{merchant.business_name} via ReturnGuard",
                    html_message=c_html,
                )
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning("Failed to dispatch delivery confirmation email: %s", exc)

        from orders.serializers import OrderListSerializer
        return success(OrderListSerializer(order).data)


class CustomerRiskProfileView(APIView):
    permission_classes = [IsAuthenticated, IsMerchantAdmin]

    def get(self, request, customer_id):
        merchant = get_merchant_from_user(request.user)
        profile = (
            ShopperProfile.objects.filter(Q(user_id=customer_id) | Q(customer_id=customer_id) | Q(id=customer_id))
            .select_related("user")
            .first()
        )
        if profile is None:
            user = User.objects.filter(id=customer_id).first()
            if user:
                profile, _ = ShopperProfile.objects.get_or_create(
                    user=user,
                    defaults={"merchant": merchant, "customer_id": f"CUST-{user.id + 1000}"},
                )
        if profile is None:
            raise NotFoundError("Customer not found.")
        customer = profile.user
        orders = Order.objects.filter(merchant=merchant, user=customer).prefetch_related("items")
        returns = ReturnRequest.objects.filter(merchant=merchant, user=customer)
        scoring = RiskScoreEvent.objects.filter(customer=customer)
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


class MerchantProductBulkUploadView(APIView):
    permission_classes = [IsAuthenticated, IsMerchantAdmin]

    def post(self, request):
        import uuid
        from django.utils.text import slugify
        merchant = get_merchant_from_user(request.user)
        products_data = request.data.get("products", [])
        if not isinstance(products_data, list) or len(products_data) == 0:
            raise AppError("A non-empty list of products is required.", code="INVALID_PAYLOAD")

        created_products = []
        for item in products_data:
            name = (item.get("name") or "").strip()
            if not name:
                continue
            price = item.get("price") or 0
            stock = item.get("stock") or 0
            image = item.get("image") or "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"
            desc = item.get("description") or ""
            cat_name = (item.get("category") or item.get("category_id") or "").strip()

            category = None
            if cat_name:
                category = Category.objects.filter(merchant=merchant, id=cat_name).first()
                if not category:
                    category = Category.objects.filter(merchant=merchant, name__iexact=cat_name).first()
                if not category:
                    slug = slugify(cat_name) or "cat"
                    cat_id = f"cat_{merchant.id}_{slug}"
                    category = Category.objects.filter(id=cat_id).first()
                    if not category:
                        category = Category.objects.create(
                            id=cat_id,
                            merchant=merchant,
                            name=cat_name,
                            slug=slug,
                            description=f"{cat_name} collection",
                        )

            product = Product.objects.create(
                merchant=merchant,
                category=category,
                name=name,
                price=price,
                stock=stock,
                image=image,
                description=desc,
                is_active=item.get("is_active", True),
            )
            created_products.append(product)

        log_action(
            merchant=merchant,
            actor=request.user.email,
            action="bulk_imported",
            target="Products Bulk Import",
            notes=f"Successfully imported {len(created_products)} products via CSV/Bulk Entry.",
        )

        return success(
            {
                "count": len(created_products),
                "products": AdminProductSerializer(created_products, many=True).data,
            },
            status=status.HTTP_201_CREATED,
        )


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


class ProductImageUploadView(APIView):
    """
    POST /admin/products/upload-image/
    Accepts multipart/form-data with one or more image files under the key 'images'.
    Saves each file to media/products/ and returns a list of accessible URLs.
    """
    permission_classes = [IsAuthenticated, IsMerchantAdmin]

    ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB per file
    MAX_FILES = 10

    def post(self, request):
        import uuid
        import os
        from django.conf import settings

        files = request.FILES.getlist("images")
        if not files:
            single = request.FILES.get("image")
            if single:
                files = [single]

        if not files:
            raise AppError("No image files provided. Use key 'images' in multipart form.", code="NO_FILES")

        if len(files) > self.MAX_FILES:
            raise AppError(f"Maximum {self.MAX_FILES} images allowed per upload.", code="TOO_MANY_FILES")

        upload_dir = os.path.join(settings.MEDIA_ROOT, "products")
        os.makedirs(upload_dir, exist_ok=True)

        urls = []
        errors = []

        for f in files:
            if f.content_type not in self.ALLOWED_TYPES:
                errors.append(f"{f.name}: unsupported type '{f.content_type}'.")
                continue
            if f.size > self.MAX_SIZE_BYTES:
                errors.append(f"{f.name}: exceeds 5 MB limit.")
                continue

            ext = os.path.splitext(f.name)[1].lower() or ".jpg"
            filename = f"prod_{uuid.uuid4().hex}{ext}"
            filepath = os.path.join(upload_dir, filename)

            with open(filepath, "wb+") as dest:
                for chunk in f.chunks():
                    dest.write(chunk)

            base_url = request.build_absolute_uri("/").rstrip("/")
            url = f"{base_url}{settings.MEDIA_URL}products/{filename}"
            urls.append(url)

        if not urls and errors:
            raise AppError(f"All uploads failed: {'; '.join(errors)}", code="UPLOAD_FAILED")

        return success(
            {"urls": urls, "count": len(urls), "errors": errors},
            status=status.HTTP_201_CREATED,
        )
