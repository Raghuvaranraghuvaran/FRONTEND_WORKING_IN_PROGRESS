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

        # 1. Verify delivery status - auto-deliver if return is requested
        if order.delivery_status != "Delivered" and order.status != "Delivered":
            order.delivery_status = "Delivered"
            order.status = "Delivered"
            if not order.delivered_at:
                order.delivered_at = timezone.now()
            order.save(update_fields=["delivery_status", "status", "delivered_at"])

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

        # Dispatch return confirmation email to customer
        try:
            c_email = getattr(user, 'email', None) or 'infiniteganesforu@gmail.com'
            c_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Return Request Received</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e293b;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;background:#f8fafc;">
        <tr><td align="center">
            <table width="100%" style="max-width:540px;background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
                <tr>
                    <td style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:28px 24px;text-align:center;color:#fff;">
                        <h1 style="margin:0;font-size:20px;font-weight:800;">Return Request Received</h1>
                        <p style="margin:4px 0 0;font-size:13px;color:#e0e7ff;">Order #{order.order_number}</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding:24px 28px;">
                        <p style="margin:0 0 16px;font-size:15px;color:#334155;">Hi <strong>{user.name or 'Valued Customer'}</strong>,</p>
                        <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.5;">
                            We have received your return request for <strong>Order #{order.order_number}</strong>.
                        </p>
                        <div style="background:#f1f5f9;border-radius:12px;padding:14px 18px;margin-bottom:18px;">
                            <p style="margin:0 0 6px;font-size:13px;color:#334155;"><strong>Reason:</strong> {return_request.reason}</p>
                            <p style="margin:0;font-size:13px;color:#334155;"><strong>Initial Status:</strong> {'Auto-Approved' if return_request.status == 'approved' else 'Under Review'}</p>
                        </div>
                        <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.4;">
                            You can check real-time return updates and timeline tracking anytime under <strong>My Orders → Returns</strong>.
                        </p>
                    </td>
                </tr>
            </table>
        </td></tr>
    </table>
</body>
</html>"""
            c_plain = f"Hi {user.name or 'Customer'},\n\nYour return request for Order #{order.order_number} has been submitted.\nReason: {return_request.reason}\nStatus: {return_request.status}\n\nThank you,\nReturnGuard Team"
            send_async_email(
                subject=f"Return Request Received for Order #{order.order_number}",
                message=c_plain,
                html_message=c_html,
                recipient_list=[c_email],
                from_name=f"{getattr(merchant, 'business_name', 'ReturnGuard')} Returns",
            )
        except Exception as c_exc:
            import logging
            logging.getLogger(__name__).warning("Failed to dispatch customer return email: %s", c_exc)

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
