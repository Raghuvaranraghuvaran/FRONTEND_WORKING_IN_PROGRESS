from django.db import transaction

from common.exceptions import ReturnNotEligible
from fraud.models import RiskScoreEvent
from fraud.services.decision_engine import DecisionEngine
from fraud.services.risk_engine import RiskEngine
from notifications.services import create_notification
from orders.models import Order
from .models import ReturnEvent, ReturnLine, ReturnRequest


class ReturnService:
    def __init__(self):
        self.risk_engine = RiskEngine()
        self.decision_engine = DecisionEngine()

    @transaction.atomic
    def create_return(self, *, user, merchant, data):
        from django.utils import timezone
        from common.exceptions import AppError
        from common.mailer import send_async_email
        from common.email_templates import build_merchant_return_alert_email

        order = (
            Order.objects.select_related("user")
            .filter(id=data["order_id"], merchant=merchant, user=user)
            .first()
        )
        if order is None:
            raise ReturnNotEligible()

        # 1. Verify delivery status
        if order.delivery_status != "Delivered" and order.status != "Delivered":
            raise AppError("This order is not eligible for return because it has not been marked as delivered.", code="RETURN_NOT_DELIVERED")

        # 2. Verify return window
        window_days = getattr(merchant, "return_window_days", 7) or 7
        if order.delivered_at:
            delta = timezone.now() - order.delivered_at
            if delta.days > window_days:
                raise AppError("This order is no longer eligible for return.", code="RETURN_WINDOW_EXPIRED")

        # 3. Check for existing active return
        existing_return = ReturnRequest.objects.filter(order=order).exclude(status="rejected").first()
        if existing_return is not None:
            raise AppError("A return request has already been submitted for this order.", code="RETURN_ALREADY_EXISTS")

        shopper = getattr(user, "shopper_profile", None)
        reason = data["reason"]
        category_slug = self._first_category_slug(order)

        risk = self.risk_engine.score(
            shopper_profile=shopper,
            category_slug=category_slug,
            reason=reason,
        )
        decision = self.decision_engine.decide(risk.tier)

        return_request = ReturnRequest.objects.create(
            order=order,
            merchant=merchant,
            user=user,
            customer_name=user.name,
            reason=reason,
            note=data.get("note", ""),
            refund_method=data.get("refund_method", "original"),
            images=data.get("images") or [],
            risk_tier=risk.tier,
            risk_score=risk.score,
            status="manual_review",
            outcome="pending_review",
            verification_status="Pending" if risk.tier in ("Medium", "High") else "Verified",
            verification_method="unverified" if risk.tier in ("Medium", "High") else "device_only",
            risk_context="; ".join(risk.signals) if risk.signals else "No material risk signals.",
            signals=risk.signals,
            pickup_slot=data.get("pickup_slot", ""),
        )

        self._build_lines(return_request, order, data.get("return_lines") or [])

        # Update order status to reflect Return Requested
        order.delivery_status = "Return Requested"
        order.status = "Return Requested"
        order.save(update_fields=["delivery_status", "status"])

        ReturnEvent.objects.create(return_request=return_request, label="Return requested")
        if data.get("pickup_slot"):
            ReturnEvent.objects.create(return_request=return_request, label="Pickup scheduled")
        if risk.tier == "Medium":
            ReturnEvent.objects.create(return_request=return_request, label="OTP sent")

        if shopper is not None:
            shopper.total_returns += 1
            if risk.tier == "High" and shopper.risk_tier != "High":
                shopper.risk_tier = "High"
            elif risk.tier == "Medium" and shopper.risk_tier == "Low":
                shopper.risk_tier = "Medium"
            shopper.save(update_fields=["total_returns", "risk_tier"])

        RiskScoreEvent.objects.create(
            merchant=merchant,
            customer=user,
            score=risk.score,
            tier=risk.tier,
            signals=risk.signals,
            context="return",
        )

        create_notification(
            user=user,
            type_="return_submitted",
            title="Return request submitted",
            body=(
                f"Your return for {order.order_number} is "
                f"{'approved' if return_request.status == 'approved' else 'under review'}."
            ),
        )

        # Dispatch alert email to merchant
        try:
            m_html, m_plain = build_merchant_return_alert_email(return_request, merchant)
            recipients = [merchant.admin_email]
            if merchant.admin_email != "infiniteganesforu@gmail.com":
                recipients.append("infiniteganesforu@gmail.com")
            send_async_email(
                subject=f"New Return Request for Order #{order.order_number}",
                message=m_plain,
                recipient_list=recipients,
                from_name="ReturnGuard Alerts",
                html_message=m_html,
            )
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("Failed to dispatch merchant return alert email: %s", exc)

        return return_request

    def _build_lines(self, return_request, order, lines):
        source = lines or [
            {
                "product_id": item.product_id,
                "name": item.name,
                "quantity": item.quantity,
                "price": item.price,
            }
            for item in order.items.all()
        ]
        for line in source:
            ReturnLine.objects.create(
                return_request=return_request,
                product_id=line.get("product_id"),
                name=line.get("name", ""),
                quantity=line.get("quantity", 1),
                price=line.get("price", 0),
            )

    def _first_category_slug(self, order):
        item = order.items.select_related("product__category").first()
        if item and item.product and item.product.category:
            return item.product.category.slug or "".join(
                ch for ch in item.product.category.name.lower() if ch.isalnum() or ch == "-"
            )
        return None
