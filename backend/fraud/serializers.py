from rest_framework import serializers
from .models import (
    CustomerRestriction,
    CustomerRiskProfile,
    EscalationHistory,
    FraudConfiguration,
    RiskScoreEvent,
)


class FraudConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = FraudConfiguration
        fields = ["id", "rule_version", "weights", "thresholds", "review_enabled"]
        read_only_fields = ["id", "rule_version"]


class CustomerRiskProfileSerializer(serializers.ModelSerializer):
    customer_email = serializers.CharField(source="customer.email", read_only=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    escalation_label = serializers.SerializerMethodField()

    class Meta:
        model = CustomerRiskProfile
        fields = [
            "id", "customer_id", "customer_email", "customer_name",
            "risk_tier", "latest_score", "device_reuse_flag",
            "escalation_level", "escalation_label",
            "confirmed_violations", "restriction_count",
            "created_at", "updated_at",
        ]

    def get_escalation_label(self, obj):
        labels = dict(CustomerRiskProfile.ESCALATION_LEVELS)
        return labels.get(obj.escalation_level, "Unknown")


class RiskScoreEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskScoreEvent
        fields = ["id", "score", "tier", "rule_version", "signals", "context", "created_at"]


class CustomerRestrictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerRestriction
        fields = [
            "id", "restriction_type", "reason", "status",
            "threshold_value", "start_date", "end_date",
            "applied_by", "removed_by", "created_at",
        ]


class EscalationHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EscalationHistory
        fields = [
            "id", "previous_level", "new_level",
            "trigger_event", "notes", "created_at",
        ]


class CustomerReviewSerializer(serializers.Serializer):
    """Aggregated data for the Merchant Case Review Screen (PDF Section 10)."""
    profile = CustomerRiskProfileSerializer()
    behavior = serializers.DictField()
    scoring = RiskScoreEventSerializer(many=True)
    restrictions = CustomerRestrictionSerializer(many=True)
    escalation_history = EscalationHistorySerializer(many=True)
    decision = serializers.DictField()


class MerchantActionSerializer(serializers.Serializer):
    """Validates merchant action requests."""
    ACTION_CHOICES = [
        "accept", "reject", "verify", "restrict_cod",
        "restrict_high_value", "require_prepaid",
        "manual_review", "increase_restriction",
        "remove_restriction", "suspend_account",
        "set_escalation_level",
    ]

    action = serializers.ChoiceField(choices=ACTION_CHOICES)
    notes = serializers.CharField(required=False, default="", allow_blank=True)
    escalation_level = serializers.IntegerField(required=False, min_value=0, max_value=5)
    restriction_id = serializers.IntegerField(
        required=False,
        help_text="Required when action is remove_restriction",
    )
    threshold_value = serializers.DecimalField(
        required=False, max_digits=12, decimal_places=2,
        help_text="Optional cap value for restriction actions",
    )
