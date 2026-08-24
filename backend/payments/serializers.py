from rest_framework import serializers
from .models import Payment, PaymentEvent


class PaymentSerializer(serializers.ModelSerializer):
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'payment_method', 'payment_method_display',
            'gateway', 'gateway_payment_id', 'transaction_id',
            'amount', 'currency', 'status', 'status_display',
            'failure_reason', 'is_demo_payment', 'payment_details',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentEvent
        fields = ['id', 'payment', 'event_type', 'gateway_event_id', 'payload', 'created_at']
        read_only_fields = ['id', 'created_at']


class ProcessPaymentSerializer(serializers.Serializer):
    """Serializer for processing demo payments"""
    payment_id = serializers.IntegerField()
    payment_data = serializers.JSONField(required=False, allow_null=True)


class WebhookSerializer(serializers.Serializer):
    gateway = serializers.CharField(default="mock")
    gateway_payment_id = serializers.CharField()
    order_id = serializers.CharField()
    status = serializers.ChoiceField(choices=("paid", "failed", "rejected", "processing"))
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    failure_reason = serializers.CharField(required=False, allow_blank=True, default="")
    signature = serializers.CharField()
    event_id = serializers.CharField(required=False, allow_blank=True, default="")
