from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Merchant, MerchantProfile

User = get_user_model()


class MerchantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Merchant
        fields = (
            "id",
            "merchant_username",
            "business_name",
            "store_slug",
            "admin_email",
            "plan_tier",
            "address",
            "city",
            "state",
            "pincode",
            "phone",
            "gstin",
            "return_window_days",
            "created_at",
        )
        read_only_fields = ("id", "merchant_username", "created_at")


class MerchantRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Merchant
        fields = (
            "business_name",
            "store_slug",
            "admin_email",
            "address",
            "city",
            "state",
            "pincode",
            "phone",
            "gstin",
        )

    def validate_store_slug(self, value):
        if Merchant.objects.filter(store_slug=value).exists():
            raise serializers.ValidationError("A store with this slug already exists.")
        return value

    def create(self, validated_data):
        return Merchant.objects.create(**validated_data)
