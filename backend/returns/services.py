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
        order = (
            Order.objects.select_related("user")
            .filter(id=data["order_id"], merchant=merchant, user=user)
            .first()
        )
        if order is None:
            raise ReturnNotEligible()

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
            risk_tier=risk.tier,
            risk_score=risk.score,
            status=decision["status"],
            outcome=decision["outcome"],
            verification_status="Pending" if risk.tier in ("Medium", "High") else "Verified",
            verification_method="unverified" if risk.tier in ("Medium", "High") else "device_only",
            risk_context="; ".join(risk.signals) if risk.signals else "No material risk signals.",
            signals=risk.signals,
            pickup_slot=data.get("pickup_slot", ""),
        )

        self._build_lines(return_request, order, data.get("return_lines") or [])

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
