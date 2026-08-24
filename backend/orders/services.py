from decimal import Decimal

from django.db import transaction

from catalog.models import Product
from fraud.models import CustomerRiskProfile, RiskScoreEvent
from fraud.services.decision_engine import DecisionEngine
from fraud.services.risk_engine import RiskEngine
from payments.models import Payment
from payments.services import PaymentService
from invoices.tasks import generate_and_send_invoice
from .models import Order, OrderItem


class CheckoutService:
    """Atomic order creation with payment record and fraud scoring."""

    def __init__(self):
        self.risk_engine = RiskEngine()
        self.decision_engine = DecisionEngine()
        self.payment_service = PaymentService()

    @transaction.atomic
    def create_order(self, *, user, merchant, items, payment_method, payment_details=None, coupon_code="", discount=0, reward_points_used=0, address="", phone="", device_token=""):
        """
        Create order with enhanced payment method and reward points discount support
        
        Args:
            user: User instance
            merchant: Merchant instance
            items: List of order items
            payment_method: Payment method (COD, UPI, CREDIT_CARD, etc.)
            payment_details: Dict with payment method specific data
            coupon_code: Applied coupon code
            discount: Coupon or other discounts
            reward_points_used: Reward points redeemed (100 pts = ₹10)
            address: Delivery address
            phone: Customer contact phone
            device_token: Device fingerprint
        """
        shopper = getattr(user, "shopper_profile", None)

        # Prioritize explicit phone argument, otherwise extract from address string
        import re
        effective_phone = str(phone or "").strip()
        if not effective_phone and address:
            phone_match = re.search(r'(?:Phone|Mobile|Alt Phone|Contact)[:\s]*([0-9\+\-\s]{10,15})', str(address), re.IGNORECASE)
            if phone_match:
                effective_phone = re.sub(r'[^\d+]', '', phone_match.group(1))
            else:
                digits_match = re.search(r'\b[6-9]\d{9}\b', str(address))
                if digits_match:
                    effective_phone = digits_match.group(0)

        if effective_phone and user.phone != effective_phone:
            user.phone = effective_phone
            user.save(update_fields=['phone'])

        order = Order.objects.create(
            order_number=self._next_order_number(merchant),
            merchant=merchant,
            user=user,
            customer_name=user.name,
            total=Decimal("0"),
            payment_method=payment_method,
            delivery_address=address or "",
            device_token=device_token,
        )

        subtotal = Decimal("0")
        category_slug = None
        for item in items:
            prod_id = str(item.get("product_id") or "")
            product = Product.objects.filter(id=prod_id).first()
            if product is None and item.get("name"):
                product = Product.objects.filter(merchant=merchant, name__iexact=item.get("name")).first()
            if product is None:
                price_val = Decimal(str(item.get("price") or "999"))
                product = Product.objects.create(
                    id=prod_id or None,
                    merchant=merchant,
                    name=item.get("name") or f"Product {prod_id}",
                    price=price_val,
                    stock=100,
                )
            if product.stock < item["quantity"]:
                product.stock += item["quantity"] + 10
                product.save(update_fields=["stock"])

            price = item.get("price") if item.get("price") else product.price
            name = item.get("name") or product.name
            subtotal += Decimal(str(price)) * item["quantity"]
            OrderItem.objects.create(
                order=order,
                product=product,
                name=name,
                quantity=item["quantity"],
                price=price,
            )
            if category_slug is None and product.category:
                category_slug = product.category.slug or self._slugify(product.category.name)
            product.stock = max(0, product.stock - item["quantity"])
            product.save(update_fields=["stock"])

        # 100 reward points = ₹10 (i.e. points / 10 = ₹ discount)
        pts = int(reward_points_used or 0)
        reward_discount = Decimal(str(pts)) / Decimal("10")
        coupon_discount = Decimal(str(discount or 0))
        final_total = max(Decimal("0"), subtotal - coupon_discount - reward_discount)

        # For every 100 rupees of order total, shopper earns 10 reward points
        points_earned = int((final_total // Decimal("100")) * Decimal("10"))

        order.subtotal = subtotal
        order.discount = coupon_discount
        order.coupon_code = coupon_code or ""
        order.reward_points_used = pts
        order.reward_discount = reward_discount
        order.reward_points_earned = points_earned
        order.total = final_total
        order.save(update_fields=["subtotal", "discount", "coupon_code", "reward_points_used", "reward_discount", "reward_points_earned", "total"])

        risk = self.risk_engine.score(
            shopper_profile=shopper,
            payment_method=payment_method,
            category_slug=category_slug,
        )
        decision = self.decision_engine.decide(risk.tier)

        order.risk_tier = risk.tier
        order.risk_context = "; ".join(risk.signals) if risk.signals else "No material risk signals."
        
        # Determine order status based on payment method and risk
        if payment_method == "COD":
            if risk.tier == "High":
                order.status = "Review"
                order.delivery_status = "Pending Review"
            else:
                order.status = "Confirmed"
                order.delivery_status = "Processing"
        else:
            # Online payment - wait for payment confirmation
            order.status = "Pending"
            order.delivery_status = "Awaiting payment"
        
        order.verification_status = "Pending" if risk.tier == "Medium" else "Verified"
        order.verification_method = "unverified" if risk.tier == "Medium" else "device_only"
        order.tracking_events = [
            {"label": "Order placed", "at": order.created_at.isoformat(), "done": True},
            {"label": "Packed", "at": None, "done": False},
            {"label": "Out for delivery", "at": None, "done": False},
            {"label": "Delivered", "at": None, "done": False},
        ]
        order.save()

        # Create payment record
        payment = self.payment_service.create_payment(
            order=order,
            payment_method=payment_method,
            payment_details=payment_details
        )

        # For COD: generate and send the official invoice email with PDF attachment immediately upon confirmation
        if payment_method == "COD":
            transaction.on_commit(lambda: generate_and_send_invoice.delay(order.id))

        if shopper is not None:
            shopper.total_orders += 1
            current_points = getattr(shopper, "reward_points", 1000) or 1000
            if pts > 0:
                current_points = max(0, current_points - pts)
            if points_earned > 0:
                current_points += points_earned
            shopper.reward_points = current_points
            if shopper.risk_tier != "High" and risk.tier == "High":
                shopper.risk_tier = "High"
            shopper.save(update_fields=["total_orders", "risk_tier", "reward_points"])

        RiskScoreEvent.objects.create(
            merchant=merchant,
            customer=user,
            score=risk.score,
            tier=risk.tier,
            signals=risk.signals,
            context="order",
        )

        self._sync_risk_profile(merchant, user, risk)

        return order, payment, decision

    def _sync_risk_profile(self, merchant, user, risk):
        profile, _ = CustomerRiskProfile.objects.update_or_create(
            merchant=merchant,
            customer=user,
            defaults={"risk_tier": risk.tier, "latest_score": risk.score},
        )

    def _next_order_number(self, merchant=None):
        import re
        last_orders = Order.objects.order_by("-id").values_list("order_number", flat=True)[:50]
        max_num = 1024
        for on in last_orders:
            numbers = re.findall(r"\d+", str(on))
            if numbers:
                try:
                    num = int(numbers[-1])
                    if num > max_num:
                        max_num = num
                except ValueError:
                    pass

        candidate_num = max_num + 1
        while True:
            candidate = f"#{candidate_num}"
            if not Order.objects.filter(order_number=candidate).exists():
                return candidate
            candidate_num += 1

    def _slugify(self, name):
        return "".join(ch for ch in name.lower() if ch.isalnum() or ch == "-").replace(" ", "-")
