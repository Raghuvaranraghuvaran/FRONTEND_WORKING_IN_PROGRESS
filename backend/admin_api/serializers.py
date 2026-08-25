from rest_framework import serializers

from accounts.models import ShopperProfile
from catalog.models import Category, Product
from fraud.models import FraudConfiguration
from returns.models import ReturnRequest
from .models import DeliveryAgent, AgentRiskSnapshot, AgentActivityLog


class ShopperProfileSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="user.id", read_only=True)
    name = serializers.CharField(source="user.name", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    phone = serializers.CharField(source="user.phone", read_only=True)

    class Meta:
        model = ShopperProfile
        fields = (
            "id",
            "merchant_id",
            "customer_id",
            "name",
            "email",
            "phone",
            "total_orders",
            "total_returns",
            "total_cod_refusals",
            "reward_points",
            "risk_tier",
            "device_reuse_flag",
            "joined_at",
        )


class ReviewReturnSerializer(serializers.Serializer):
    action = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True, default="")


class FraudConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = FraudConfiguration
        fields = ("rule_version", "weights", "thresholds", "review_enabled", "updated_at")
        read_only_fields = ("rule_version", "updated_at")


class AdminCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "description", "slug")
        read_only_fields = ("id",)


class AdminProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True, default="Uncategorized")

    class Meta:
        model = Product
        fields = (
            "id",
            "merchant_id",
            "category_id",
            "category_name",
            "name",
            "price",
            "stock",
            "image",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        )


class AdminProductWriteSerializer(serializers.ModelSerializer):
    category_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Product
        fields = (
            "name",
            "category_id",
            "price",
            "stock",
            "image",
            "description",
            "is_active",
        )

    def validate_category_id(self, value):
        if not value:
            return value
        # Scope the lookup to the merchant so cross-merchant category IDs
        # are rejected and merchant-specific IDs always resolve correctly.
        merchant = self.context.get("merchant")
        if merchant:
            if not Category.objects.filter(id=value, merchant=merchant).exists():
                raise serializers.ValidationError("Category does not exist.")
        else:
            if not Category.objects.filter(id=value).exists():
                raise serializers.ValidationError("Category does not exist.")
        return value


class AgentActivityLogSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source="agent.name", read_only=True)

    class Meta:
        model = AgentActivityLog
        fields = ("id", "agent_id", "agent_name", "event_type", "message", "created_at")


class AgentRiskSnapshotSerializer(serializers.ModelSerializer):
    reviewed_by_email = serializers.CharField(source="reviewed_by.email", read_only=True, default=None)

    class Meta:
        model = AgentRiskSnapshot
        fields = (
            "id",
            "agent_id",
            "total_deliveries",
            "total_returns",
            "flagged_count",
            "actual_return_rate",
            "expected_baseline_rate",
            "anomaly_gap",
            "status_note",
            "reviewed_by_email",
            "reviewed_at",
            "created_at",
        )


class DeliveryAgentSerializer(serializers.ModelSerializer):
    anomaly_gap = serializers.FloatField(read_only=True)

    class Meta:
        model = DeliveryAgent
        fields = (
            "id",
            "merchant_id",
            "name",
            "avatar_url",
            "route",
            "location_name",
            "pincode",
            "total_deliveries",
            "total_returns_handled",
            "return_rate",
            "expected_return_rate",
            "flagged_return_count",
            "risk_flag",
            "current_risk_level",
            "is_under_investigation",
            "anomaly_gap",
            "created_at",
            "updated_at",
        )


class AgentInvestigateSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class AgentSignOffSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    risk_level = serializers.ChoiceField(choices=["LOW", "MEDIUM", "HIGH", "Normal", "Monitor", "Review"], required=False, default="LOW")

