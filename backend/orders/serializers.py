from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ("product_id", "name", "quantity", "price")


class OrderListSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    invoice = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "merchant_id",
            "user_id",
            "customer_name",
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
    payment_method = serializers.ChoiceField(choices=(
        "COD", "UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING", "MOBILE_BANKING", "Prepaid"
    ))
    payment_details = serializers.JSONField(required=False, allow_null=True)
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    discount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)
    reward_points_used = serializers.IntegerField(required=False, default=0, min_value=0)
    address = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    device_token = serializers.CharField(required=False, allow_blank=True)
