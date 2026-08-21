from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Address, ShopperProfile

User = get_user_model()


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ("id", "label", "line", "is_primary")


class ShopperSerializer(serializers.ModelSerializer):
    addresses = AddressSerializer(many=True, read_only=True)
    customer_id = serializers.CharField(source="shopper_profile.customer_id", read_only=True)
    merchant_id = serializers.CharField(source="shopper_profile.merchant_id", read_only=True, allow_null=True)
    total_orders = serializers.IntegerField(source="shopper_profile.total_orders", read_only=True)
    total_returns = serializers.IntegerField(source="shopper_profile.total_returns", read_only=True)
    total_cod_refusals = serializers.IntegerField(source="shopper_profile.total_cod_refusals", read_only=True)
    risk_tier = serializers.CharField(source="shopper_profile.risk_tier", read_only=True)
    device_reuse_flag = serializers.BooleanField(source="shopper_profile.device_reuse_flag", read_only=True)
    joined_at = serializers.DateTimeField(source="shopper_profile.joined_at", read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "name",
            "phone",
            "role",
            "addresses",
            "customer_id",
            "merchant_id",
            "total_orders",
            "total_returns",
            "total_cod_refusals",
            "risk_tier",
            "device_reuse_flag",
            "joined_at",
        )
        read_only_fields = (
            "id",
            "role",
            "addresses",
            "customer_id",
            "merchant_id",
            "total_orders",
            "total_returns",
            "total_cod_refusals",
            "risk_tier",
            "device_reuse_flag",
            "joined_at",
        )


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    address = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ("name", "email", "phone", "password", "address")

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def create(self, validated_data):
        address_line = validated_data.pop("address", "")
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data.pop("password"),
            name=validated_data["name"],
            phone=validated_data.get("phone", ""),
            role=User.ROLE_SHOPPER,
        )
        profile = ShopperProfile.objects.create(
            user=user,
            customer_id=f"CUST-{user.id + 1000}",
        )
        if address_line:
            Address.objects.create(shopper=profile, label="Home", line=address_line, is_primary=True)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class GoogleLoginSerializer(serializers.Serializer):
    credential = serializers.CharField()


class LoginOTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class LoginOTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    challenge_id = serializers.IntegerField(required=False, allow_null=True)
    code = serializers.RegexField(regex=r"^\d{6}$")
