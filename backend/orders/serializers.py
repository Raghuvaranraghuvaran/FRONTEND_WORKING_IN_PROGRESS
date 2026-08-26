from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    title = serializers.CharField(source="name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ("id", "product_id", "name", "title", "quantity", "price", "image")

    def get_image(self, obj):
        if obj.product and obj.product.image:
            return obj.product.image
        from catalog.models import Product
        if obj.product_id:
            p = Product.objects.filter(id=obj.product_id).first()
            if p and p.image:
                return p.image
        return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80"


class OrderListSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.CharField(source="user.email", read_only=True)
    invoice = serializers.SerializerMethodField()
    is_delivered = serializers.SerializerMethodField()
    can_track = serializers.SerializerMethodField()
    is_cancellable = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "merchant_id",
            "user_id",
            "customer_name",
            "customer_email",
            "items",
            "subtotal",
            "discount",
            "coupon_code",
            "reward_points_used",
            "reward_discount",
            "reward_points_earned",
            "total",
            "payment_method",
            "status",
            "delivery_status",
            "delivered_at",
            "is_delivered",
            "can_track",
            "is_cancellable",
            "cancelled_at",
            "cancellation_reason",
            "cancelled_by",
            "cancellation_notes",
            "risk_tier",
            "verification_status",
            "verification_method",
            "device_token",
            "delivery_address",
            "created_at",
            "risk_context",
            "tracking_events",
            "invoice",
        )

    def get_customer_name(self, obj):
        if obj.customer_name:
            return obj.customer_name
        if obj.user:
            return obj.user.name or (obj.user.email.split("@")[0] if obj.user.email else "Valued Customer")
        return "Valued Customer"

    def get_is_delivered(self, obj):
        st = str(getattr(obj, "delivery_status", "") or getattr(obj, "status", "")).strip().lower()
        return st in {"delivered", "product returned", "refund processed", "return approved", "return rejected"}

    def get_can_track(self, obj):
        st = str(getattr(obj, "delivery_status", "") or getattr(obj, "status", "")).strip().lower()
        return st not in {"delivered", "product returned", "refund processed", "return approved", "return rejected", "cancelled"}

    def get_is_cancellable(self, obj):
        st = str(getattr(obj, "delivery_status", "") or getattr(obj, "status", "")).strip().lower()
        # Allowed only before shipment starts
        disallowed = {
            "in transit", "shipped", "in shipment", "out for delivery",
            "delivered", "cancelled", "return requested", "return approved",
            "return rejected", "product returned", "refund processed", "refused"
        }
        return st not in disallowed

    def get_invoice(self, obj):
        invoice = getattr(obj, "invoice", None)
        if invoice is None:
            return None
        from invoices.serializers import InvoiceSerializer
        return InvoiceSerializer(invoice).data


class CheckoutItemSerializer(serializers.Serializer):
    product_id = serializers.CharField()
    name = serializers.CharField(required=False)
    quantity = serializers.IntegerField(min_value=1)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)


class CheckoutSerializer(serializers.Serializer):
    items = CheckoutItemSerializer(many=True, allow_empty=False)
    payment_method = serializers.CharField(required=False, default="COD")
    payment_details = serializers.JSONField(required=False, allow_null=True)
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    discount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)
    reward_points_used = serializers.IntegerField(required=False, default=0, min_value=0)
    address = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    device_token = serializers.CharField(required=False, allow_blank=True)
    email = serializers.CharField(required=False, allow_blank=True)
    customer_name = serializers.CharField(required=False, allow_blank=True)

    def validate_payment_method(self, value):
        if not value:
            return "COD"
        val = str(value).strip().upper()
        mapping = {
            "CASH": "COD",
            "CASH ON DELIVERY": "COD",
            "COD": "COD",
            "UPI": "UPI",
            "CARD": "CREDIT_CARD",
            "CREDIT": "CREDIT_CARD",
            "CREDIT_CARD": "CREDIT_CARD",
            "CREDIT CARD": "CREDIT_CARD",
            "DEBIT": "DEBIT_CARD",
            "DEBIT_CARD": "DEBIT_CARD",
            "DEBIT CARD": "DEBIT_CARD",
            "NETBANKING": "NET_BANKING",
            "NET_BANKING": "NET_BANKING",
            "NET BANKING": "NET_BANKING",
            "MOBILE_BANKING": "MOBILE_BANKING",
            "MOBILE BANKING": "MOBILE_BANKING",
            "PREPAID": "Prepaid",
        }
        return mapping.get(val, value)
