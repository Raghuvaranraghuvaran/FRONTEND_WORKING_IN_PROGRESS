from rest_framework import serializers

from .models import DoorstepProof, ReturnLine, ReturnRequest


class ReturnLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReturnLine
        fields = ("product_id", "name", "quantity", "price")


class ReturnRequestSerializer(serializers.ModelSerializer):
    return_lines = ReturnLineSerializer(many=True, read_only=True)
    timeline = serializers.SerializerMethodField()
    order_number = serializers.CharField(source="order.order_number", read_only=True)

    class Meta:
        model = ReturnRequest
        fields = (
            "id",
            "order_id",
            "order_number",
            "merchant_id",
            "user_id",
            "customer_name",
            "reason",
            "note",
            "risk_tier",
            "risk_score",
            "status",
            "outcome",
            "verification_status",
            "verification_method",
            "risk_context",
            "signals",
            "return_lines",
            "pickup_slot",
            "proof_image_url",
            "proof_verified",
            "timeline",
            "created_at",
            "reviewed_by",
            "reviewed_at",
        )

    def get_timeline(self, obj):
        return [{"label": e.label, "at": e.at.isoformat()} for e in obj.timeline.all()]


class CreateReturnSerializer(serializers.Serializer):
    order_id = serializers.CharField()
    reason = serializers.CharField()
    note = serializers.CharField(required=False, allow_blank=True, default="")
    proof_image_url = serializers.CharField(required=False, allow_blank=True, default="")
    return_lines = serializers.ListField(
        child=serializers.DictField(), required=False, default=list
    )
    pickup_slot = serializers.CharField(required=False, allow_blank=True, default="")


class DoorstepProofSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoorstepProof
        fields = ("id", "return_request_id", "proof_type", "file", "metadata")
