from rest_framework import serializers

from .models import DoorstepProof, ReturnLine, ReturnRequest


class ReturnLineSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ReturnLine
        fields = ("product_id", "name", "quantity", "price", "image")

    def get_image(self, obj):
        if obj.product and obj.product.image:
            return obj.product.image
        from catalog.models import Product
        if obj.product_id:
            p = Product.objects.filter(id=obj.product_id).first()
            if p and p.image:
                return p.image
        return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80"



class ReturnRequestSerializer(serializers.ModelSerializer):
    return_lines = ReturnLineSerializer(many=True, read_only=True)
    timeline = serializers.SerializerMethodField()
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    customer_email = serializers.CharField(source="user.email", read_only=True)
    order_total = serializers.DecimalField(source="order.total", max_digits=12, decimal_places=2, read_only=True)
    delivered_at = serializers.DateTimeField(source="order.delivered_at", read_only=True)

    class Meta:
        model = ReturnRequest
        fields = (
            "id",
            "order_id",
            "order_number",
            "order_total",
            "delivered_at",
            "merchant_id",
            "user_id",
            "customer_name",
            "customer_email",
            "type",
            "reason",
            "note",
            "refund_method",
            "images",
            "risk_tier",
            "risk_score",
            "status",
            "outcome",
            "verification_status",
            "verification_method",
            "risk_context",
            "signals",
            "checkpoint_signals",
            "return_lines",
            "pickup_slot",
            "proof_image_url",
            "proof_verified",
            "timeline",
            "created_at",
            "reviewed_by",
            "reviewed_at",
            # Shopper-submitted verification
            "shopper_serial_number",
            "shopper_imei_number",
            "shopper_reported_condition",
            # Agent verification
            "returned_serial_number",
            "returned_imei_number",
            "serial_mismatch",
            "imei_mismatch",
            "product_condition",
            "packaging_condition",
            "accessories_expected",
            "accessories_returned",
            "accessories_missing",
            "quantity_claimed",
            "quantity_received",
            "is_product_swap_detected",
            "swap_details",
            "original_reason",
            "reason_changed",
            "verified_by",
            "verified_at",
            "verification_notes",
        )

    def get_timeline(self, obj):
        return [{"label": e.label, "at": e.at.isoformat()} for e in obj.timeline.all()]


class CreateReturnSerializer(serializers.Serializer):
    order_id = serializers.CharField()
    reason = serializers.CharField()
    type = serializers.CharField(required=False, default="REFUND")
    note = serializers.CharField(required=False, allow_blank=True, default="")
    proof_image_url = serializers.CharField(required=False, allow_blank=True, default="")
    refund_method = serializers.CharField(required=False, default="original")
    images = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    return_lines = serializers.ListField(
        child=serializers.DictField(), required=False, default=list
    )
    pickup_slot = serializers.CharField(required=False, allow_blank=True, default="")
    # Shopper-submitted verification fields
    serial_number = serializers.CharField(required=False, allow_blank=True, default="")
    imei_number = serializers.CharField(required=False, allow_blank=True, default="")
    product_condition = serializers.CharField(required=False, default="unknown")
    quantity = serializers.IntegerField(required=False, default=1)


class ProductVerificationSerializer(serializers.Serializer):
    """Serializer for agent/warehouse product verification submission."""
    returned_serial_number = serializers.CharField(required=False, allow_blank=True, default="")
    returned_imei_number = serializers.CharField(required=False, allow_blank=True, default="")
    product_condition = serializers.ChoiceField(
        choices=["unused", "used", "damaged", "soiled", "tampered", "tag_removed", "unknown"],
        default="unknown"
    )
    packaging_condition = serializers.ChoiceField(
        choices=["original_intact", "original_damaged", "different_box", "no_packaging", "not_inspected"],
        default="not_inspected"
    )
    accessories_returned = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    quantity_received = serializers.IntegerField(required=False, default=None)
    is_product_swap_detected = serializers.BooleanField(required=False, default=False)
    swap_details = serializers.CharField(required=False, allow_blank=True, default="")
    verification_notes = serializers.CharField(required=False, allow_blank=True, default="")
    verification_images = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )


class DoorstepProofSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoorstepProof
        fields = ("id", "return_request_id", "proof_type", "file", "metadata")
