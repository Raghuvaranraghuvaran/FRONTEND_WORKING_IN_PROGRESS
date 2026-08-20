from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ("product_id", "name", "quantity", "price")


class OrderListSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "merchant_id",
            "user_id",
            "customer_name",
            "items",
            "total",
            "payment_method",
            "status",
            "delivery_status",
            "risk_tier",
            "verification_status",
            "verification_method",
            "device_token",
            "created_at",
            "risk_context",
            "tracking_events",
        )


class CheckoutItemSerializer(serializers.Serializer):
    product_id = serializers.CharField()
    name = serializers.CharField(required=False)
    quantity = serializers.IntegerField(min_value=1)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)


class CheckoutSerializer(serializers.Serializer):
    items = CheckoutItemSerializer(many=True)
    payment_method = serializers.ChoiceField(choices=("COD", "Prepaid"))
    address = serializers.CharField(required=False, allow_blank=True)
    device_token = serializers.CharField(required=False, allow_blank=True)
