from django.db.models import Prefetch
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from common.exceptions import AppError
from common.response import success
from common.tenancy import get_merchant_from_user
from .models import Order, OrderItem
from .serializers import CheckoutSerializer, OrderListSerializer
from .services import CheckoutService


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        merchant = get_merchant_from_user(request.user)
        if merchant is None:
            raise AppError("Merchant context could not be resolved.", code="MERCHANT_NOT_FOUND")

        try:
            order, payment, decision = CheckoutService().create_order(
                user=request.user,
                merchant=merchant,
                items=data["items"],
                payment_method=data["payment_method"],
                payment_details=data.get("payment_details"),
                coupon_code=data.get("coupon_code", ""),
                discount=data.get("discount", 0),
                reward_points_used=data.get("reward_points_used", 0),
                address=data.get("address", ""),
                phone=data.get("phone", ""),
                device_token=data.get("device_token", ""),
            )
        except ValueError as exc:
            raise AppError(str(exc), code="CHECKOUT_FAILED")

        from payments.serializers import PaymentSerializer
        from accounts.serializers import ShopperSerializer
        
        return success({
            "order": OrderListSerializer(order).data,
            "payment": PaymentSerializer(payment).data,
            "decision": decision,
            "user": ShopperSerializer(request.user).data,
        }, status=status.HTTP_201_CREATED)


class ShopperOrderListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderListSerializer

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related("items")
            .order_by("-created_at")
        )


class ShopperOrderDetailView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderListSerializer
    lookup_field = "pk"

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items")


class TrackOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        order = Order.objects.filter(user=request.user, pk=pk).first()
        if order is None:
            raise AppError("Order not found.", code="NOT_FOUND")
        return success(order.tracking_events)


class ReportDoorstepRefusalView(APIView):
    """Logs delivery doorstep refusal, updates customer profile, and auto-escalates (Feature 5)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        from common.tenancy import get_merchant_from_user
        from accounts.models import ShopperProfile
        from fraud.services import escalation_engine
        from audit.services import log_action

        merchant = get_merchant_from_user(request.user)
        order = Order.objects.filter(pk=pk if str(pk).isdigit() else 0).first() or Order.objects.filter(order_number__icontains=str(pk)).first()
        if not order:
            raise AppError("Order not found.", code="NOT_FOUND")

        reason = request.data.get("reason", "Customer refused delivery at doorstep")
        refusal_type = request.data.get("refusal_type", "customer_rejected")
        notes = request.data.get("notes", "")

        # 1. Update order status and flag
        order.delivery_status = "Refused"
        order.is_cod_refused = True
        events = list(order.tracking_events or [])
        events.append({
            "label": f"Doorstep Delivery Refused: {reason}",
            "at": timezone.now().isoformat(),
            "done": True,
        })
        order.tracking_events = events
        order.save(update_fields=["delivery_status", "is_cod_refused", "tracking_events"])

        # 2. Update customer ShopperProfile
        if order.user:
            profile = ShopperProfile.objects.filter(user=order.user).first()
            if profile:
                profile.total_cod_refusals = (profile.total_cod_refusals or 0) + 1
                profile.save(update_fields=["total_cod_refusals"])

            # 3. Auto-escalate progressive level
            escalation_engine.escalate(
                customer=order.user,
                merchant=order.merchant or merchant,
                trigger_event=f"Doorstep COD Refusal on Order #{order.order_number}: {reason}",
                applied_by=request.user.email,
            )

        log_action(
            merchant=order.merchant or merchant,
            actor=request.user.email,
            action="cod_refusal_logged",
            target=f"Order #{order.order_number}",
            notes=f"{refusal_type}: {reason} | {notes}",
        )

        return success({
            "order_number": order.order_number,
            "status": order.delivery_status,
            "is_cod_refused": order.is_cod_refused,
            "message": "Doorstep refusal logged and progressive escalation updated.",
        })


class UpdateOrderStatusView(APIView):
    """Update order delivery status (e.g. Processing, In Transit, Delivered, etc.)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        merchant = require_merchant_context(request)
        order = Order.objects.filter(pk=pk).first()
        if not order and isinstance(pk, str):
            order = Order.objects.filter(order_number=pk).first()
        if not order:
            return not_found("Order not found.")

        new_status = request.data.get("deliveryStatus") or request.data.get("delivery_status") or request.data.get("status")
        if not new_status:
            return bad_request("deliveryStatus is required.")

        order.delivery_status = new_status
        update_fields = ["delivery_status"]

        if new_status == "Delivered":
            order.status = "Delivered"
            order.delivered_at = timezone.now()
            update_fields.extend(["status", "delivered_at"])

            events = list(order.tracking_events or [])
            events.append({
                "label": "Package Delivered Successfully",
                "at": timezone.now().isoformat(),
                "done": True,
            })
            order.tracking_events = events
            update_fields.append("tracking_events")

            # Trigger delivered email if user email is present
            if order.user and getattr(order.user, "email", None):
                try:
                    from common.email import send_email
                    from common.email_templates import order_delivered_email
                    html, text = order_delivered_email(order=order)
                    send_email(
                        to_email=order.user.email,
                        subject=f"Delivered: Order #{order.order_number} has arrived!",
                        html_content=html,
                        text_content=text,
                    )
                except Exception as e:
                    print(f"[Email error on delivery update]: {e}")

        order.save(update_fields=update_fields)

        return success({
            "id": order.id,
            "order_number": order.order_number,
            "delivery_status": order.delivery_status,
            "status": order.status,
            "message": f"Order status updated to {new_status}.",
        })


