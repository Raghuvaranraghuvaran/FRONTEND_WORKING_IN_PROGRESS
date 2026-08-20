from decimal import Decimal

from django.db import transaction

from catalog.models import Product
from fraud.models import CustomerRiskProfile, RiskScoreEvent
from fraud.services.decision_engine import DecisionEngine
from fraud.services.risk_engine import RiskEngine
from payments.models import Payment
from .models import Order, OrderItem


class CheckoutService:
    """Atomic order creation with payment record and fraud scoring."""

    def __init__(self):
        self.risk_engine = RiskEngine()
        self.decision_engine = DecisionEngine()

    @transaction.atomic
    def create_order(self, *, user, merchant, items, payment_method, device_token=""):
        shopper = getattr(user, "shopper_profile", None)

        order = Order.objects.create(
            order_number=self._next_order_number(merchant),
            merchant=merchant,
            user=user,
            customer_name=user.name,
            total=Decimal("0"),
            payment_method=payment_method,
            device_token=device_token,
        )

        total = Decimal("0")
        category_slug = None
        for item in items:
            product = Product.objects.filter(id=item["product_id"]).first()
            if product is None:
                raise ValueError(f"Unknown product {item['product_id']}")
            if product.stock < item["quantity"]:
                raise ValueError(f"Insufficient stock for {product.name}")
            price = item.get("price") if item.get("price") else product.price
            name = item.get("name") or product.name
            total += Decimal(str(price)) * item["quantity"]
            OrderItem.objects.create(
                order=order,
                product=product,
                name=name,
                quantity=item["quantity"],
                price=price,
            )
            if category_slug is None and product.category:
                category_slug = product.category.slug or self._slugify(product.category.name)
            product.stock -= item["quantity"]
            product.save(update_fields=["stock"])

        order.total = total
        order.save(update_fields=["total"])

        risk = self.risk_engine.score(
            shopper_profile=shopper,
            payment_method=payment_method,
            category_slug=category_slug,
        )
        decision = self.decision_engine.decide(risk.tier)

        order.risk_tier = risk.tier
        order.risk_context = "; ".join(risk.signals) if risk.signals else "No material risk signals."
        if risk.tier == "High":
            order.status = "Review"
            order.delivery_status = "Pending Review"
        else:
            order.status = "Active"
            order.delivery_status = "Processing"
        order.verification_status = "Pending" if risk.tier == "Medium" else "Verified"
        order.verification_method = "unverified" if risk.tier == "Medium" else "device_only"
        order.tracking_events = [
            {"label": "Order placed", "at": order.created_at.isoformat(), "done": True},
            {"label": "Packed", "at": None, "done": False},
            {"label": "Out for delivery", "at": None, "done": False},
            {"label": "Delivered", "at": None, "done": False},
        ]
        order.save()

        if payment_method == "Prepaid":
            Payment.objects.create(
                order=order,
                merchant=merchant,
                gateway="mock",
                amount=total,
                status=Payment.STATUS_PROCESSING,
            )
        else:
            Payment.objects.create(
                order=order,
                merchant=merchant,
                gateway="cod",
                amount=total,
                status=Payment.STATUS_COD_PENDING,
            )

        if shopper is not None:
            shopper.total_orders += 1
            if shopper.risk_tier != "High" and risk.tier == "High":
                shopper.risk_tier = "High"
            shopper.save(update_fields=["total_orders", "risk_tier"])

        RiskScoreEvent.objects.create(
            merchant=merchant,
            customer=user,
            score=risk.score,
            tier=risk.tier,
            signals=risk.signals,
            context="order",
        )

        self._sync_risk_profile(merchant, user, risk)

        return order, decision

    def _sync_risk_profile(self, merchant, user, risk):
        profile, _ = CustomerRiskProfile.objects.update_or_create(
            merchant=merchant,
            customer=user,
            defaults={"risk_tier": risk.tier, "latest_score": risk.score},
        )

    def _next_order_number(self, merchant):
        last = (
            Order.objects.filter(merchant=merchant)
            .order_by("-id")
            .values_list("order_number", flat=True)
            .first()
        )
        if last:
            try:
                return f"#{int(last.lstrip('#') or 1028) + 1}"
            except ValueError:
                return "#1028"
        return "#1028"

    def _slugify(self, name):
        return "".join(ch for ch in name.lower() if ch.isalnum() or ch == "-").replace(" ", "-")
