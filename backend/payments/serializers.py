from rest_framework import serializers

from .models import Payment, PaymentEvent


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            "id",
            "order_id",
            "gateway",
            "gateway_payment_id",
            "amount",
            "status",
            "failure_reason",
            "created_at",
        )


class WebhookSerializer(serializers.Serializer):
    gateway = serializers.CharField(default="mock")
    gateway_payment_id = serializers.CharField()
    order_id = serializers.CharField()
    status = serializers.ChoiceField(choices=("paid", "failed", "rejected", "processing"))
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    failure_reason = serializers.CharField(required=False, allow_blank=True, default="")
    signature = serializers.CharField()
    event_id = serializers.CharField(required=False, allow_blank=True, default="")
