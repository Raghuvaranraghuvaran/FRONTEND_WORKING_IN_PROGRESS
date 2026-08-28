from django.db import transaction

from common.exceptions import ReturnNotEligible
from fraud.models import RiskScoreEvent
from fraud.services.decision_engine import DecisionEngine
from fraud.services.risk_engine import RiskEngine
from fraud.services.signal_extractors import check_return_eligibility
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

        order_raw = str(data["order_id"]).replace("#", "").strip()
        order = None
        if order_raw.isdigit():
            order = Order.objects.select_related("user", "merchant").filter(id=int(order_raw)).first()
        if order is None:
            order = Order.objects.select_related("user", "merchant").filter(order_number__icontains=order_raw).first()
        if order is None:
            order = (
                Order.objects.select_related("user", "merchant")
                .filter(merchant=merchant, user=user)
                .first()
            )

        if order is None:
            raise ReturnNotEligible()

        if user and user.is_authenticated and order.user and order.user_id != user.id:
            raise ReturnNotEligible()

        if not user or not user.is_authenticated:
            if order.user:
                user = order.user
        if order.merchant:
            merchant = order.merchant

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

        # 3. Check for existing active return (CP23: track duplicates)
        existing_return = ReturnRequest.objects.filter(order=order).exclude(status="rejected").first()
        if existing_return is not None:
            # CP23: Increment duplicate count on shopper profile
            shopper = getattr(user, "shopper_profile", None)
            if shopper:
                shopper.duplicate_return_request_count = (shopper.duplicate_return_request_count or 0) + 1
                shopper.save(update_fields=["duplicate_return_request_count"])
            return existing_return

        shopper = getattr(user, "shopper_profile", None)
        reason = data["reason"]
        return_type = data.get("type", "REFUND")
        category_slug = self._first_category_slug(order)

        # Resolve category and product for eligibility + scoring
        first_item = order.items.select_related("product__category", "variant").first()
        category = first_item.product.category if first_item and first_item.product else None
        product = first_item.product if first_item else None

        # ── TYPE A: ELIGIBILITY CHECK (pre-scoring gate) ──
        replacement_count = 0
        if shopper and return_type == "REPLACEMENT":
            replacement_count = shopper.replacement_count or 0

        eligible, elig_reasons = check_return_eligibility(
            order=order,
            order_item=first_item,
            category=category,
            return_type=return_type,
            replacement_count=replacement_count,
        )

        if not eligible:
            raise AppError(
                "; ".join(elig_reasons),
                code="RETURN_NOT_ELIGIBLE"
            )

        # ── Update shopper behavior counters ──
        if shopper:
            # CP9: Track damage claims
            if reason in ("damaged", "broken", "scratched", "torn"):
                shopper.damage_claim_count = (shopper.damage_claim_count or 0) + 1

                # CP10: Check if evidence was provided
                images = data.get("images") or []
                if not images:
                    shopper.damage_no_evidence_count = (shopper.damage_no_evidence_count or 0) + 1

            # CP14: Update purchase/refund amounts
            order_total = float(order.total or 0)
            if order_total > 0:
                shopper.total_purchase_amount = float(shopper.total_purchase_amount or 0) + order_total

            # CP5: Update average order value
            total_orders = (shopper.total_orders or 0) + 1
            total_purchased = float(shopper.total_purchase_amount or 0)
            if total_orders > 0:
                shopper.avg_order_value = total_purchased / total_orders

            # CP1: Track size exchanges
            if return_type == "EXCHANGE" and data.get("exchange_variant"):
                shopper.size_exchange_count = (shopper.size_exchange_count or 0) + 1

            # CP24: Track replacements
            if return_type == "REPLACEMENT":
                shopper.replacement_count = (shopper.replacement_count or 0) + 1

            shopper.save(update_fields=[
                "damage_claim_count", "damage_no_evidence_count",
                "total_purchase_amount", "avg_order_value",
                "size_exchange_count", "replacement_count",
            ])

        # ── FULL 28-CHECKPOINT RISK SCORING ──
        risk = self.risk_engine.score(
            merchant=merchant,
            shopper_profile=shopper,
            category_slug=category_slug,
            reason=reason,
            order=order,
            order_item=first_item,
            return_request=None,  # Not created yet, some Type B checks happen post-creation
            category=category,
            product=product,
            user=user,
            return_type=return_type,
            replacement_count=replacement_count,
            payment_method=getattr(order, "payment_method", ""),
            order_total=float(order.total or 0),
            variant_count=order.items.count(),
            order_date=order.created_at,
            escalation_level=getattr(shopper, "escalation_level", 0) if shopper else 0,
        )
        decision = self.decision_engine.decide(risk.tier)

        # Serialize checkpoint results
        checkpoint_data = []
        for cp in risk.checkpoints:
            checkpoint_data.append({
                "id": cp.checkpoint_id,
                "name": cp.checkpoint_name,
                "tier_type": cp.tier_type,
                "score_delta": cp.score_delta,
                "signals": cp.signals,
                "severity": cp.severity,
            })

        cust_name = getattr(user, "name", "") or getattr(order, "customer_name", "") or (user.email.split("@")[0] if getattr(user, "email", None) else "Valued Customer")

        # Determine initial status based on tier
        initial_status = "manual_review"
        if risk.tier == "Low":
            initial_status = "approved"
        elif risk.tier == "Critical":
            initial_status = "hold"

        return_request = ReturnRequest.objects.create(
            order=order,
            merchant=merchant,
            user=user,
            customer_name=cust_name,
            reason=reason,
            type=return_type,
            note=data.get("note", ""),
            refund_method=data.get("refund_method", "original"),
            images=data.get("images") or [],
            risk_tier=risk.tier,
            risk_score=risk.score,
            status=initial_status,
            outcome="auto_approved" if risk.tier == "Low" else "pending_review",
            verification_status="Pending" if risk.tier in ("Medium", "High", "Critical") else "Verified",
            verification_method="unverified" if risk.tier in ("Medium", "High", "Critical") else "device_only",
            risk_context="; ".join(risk.signals) if risk.signals else "No material risk signals.",
            signals=risk.signals,
            checkpoint_signals=checkpoint_data,
            pickup_slot=data.get("pickup_slot", ""),
            # Shopper-submitted verification data
            shopper_serial_number=data.get("serial_number", ""),
            shopper_imei_number=data.get("imei_number", ""),
            shopper_reported_condition=data.get("product_condition", "unknown"),
            original_reason=reason,
            quantity_claimed=data.get("quantity", 1) or 1,
            # Pre-populate expected accessories from product
            accessories_expected=getattr(product, "included_accessories", []) if product else [],
        )

        self._build_lines(return_request, order, data.get("return_lines") or [])

        # Update order status to reflect Return Requested
        order.delivery_status = "Return Requested"
        order.status = "Return Requested"
        order.save(update_fields=["delivery_status", "status"])

        # Update product return count (CP27)
        if product:
            product.total_returns_count = (product.total_returns_count or 0) + 1
            product.save(update_fields=["total_returns_count"])

        ReturnEvent.objects.create(return_request=return_request, label="Return requested")
        if data.get("pickup_slot"):
            ReturnEvent.objects.create(return_request=return_request, label="Pickup scheduled")
        if risk.tier == "Medium":
            ReturnEvent.objects.create(return_request=return_request, label="OTP sent")
        if risk.tier == "Critical":
            ReturnEvent.objects.create(return_request=return_request, label="⚠️ HOLD — Awaiting product verification")
        if risk.tier == "High":
            ReturnEvent.objects.create(return_request=return_request, label="Flagged for manual review")

        if shopper is not None:
            shopper.total_returns += 1
            if risk.tier in ("High", "Critical") and shopper.risk_tier not in ("High", "Critical"):
                shopper.risk_tier = risk.tier
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
            ord_clean = str(order.order_number).replace("#", "").strip()
            c_email = getattr(user, 'email', None) or getattr(order.user, 'email', None)
            if c_email:
                recipients = [c_email]

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
                        <p style="margin:4px 0 0;font-size:13px;color:#e0e7ff;">Order #{ord_clean}</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding:24px 28px;">
                        <p style="margin:0 0 16px;font-size:15px;color:#334155;">Hi <strong>{user.name or 'Valued Customer'}</strong>,</p>
                        <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.5;">
                            We have received your return request for <strong>Order #{ord_clean}</strong>.
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
                c_plain = f"Hi {user.name or 'Customer'},\n\nYour return request for Order #{ord_clean} has been submitted.\nReason: {return_request.reason}\nStatus: {return_request.status}\n\nThank you,\nReturnGuard Team"
                send_async_email(
                    subject=f"Return Request Received for Order #{ord_clean}",
                    message=c_plain,
                    html_message=c_html,
                    recipient_list=recipients,
                    from_name=f"{getattr(merchant, 'business_name', 'ReturnGuard')} Returns",
                )
        except Exception as c_exc:
            import logging
            logging.getLogger(__name__).warning("Failed to dispatch customer return email: %s", c_exc)

        # Dispatch alert email to merchant
        try:
            m_html, m_plain = build_merchant_return_alert_email(return_request, merchant)
            m_email = getattr(merchant, "admin_email", None)
            if m_email:
                send_async_email(
                    subject=f"New Return Request for Order #{ord_clean}",
                    message=m_plain,
                    recipient_list=[m_email],
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
