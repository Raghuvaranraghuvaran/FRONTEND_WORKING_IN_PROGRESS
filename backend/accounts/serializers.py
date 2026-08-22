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
    customer_id = serializers.SerializerMethodField()
    merchant_id = serializers.SerializerMethodField()
    total_orders = serializers.SerializerMethodField()
    total_returns = serializers.SerializerMethodField()
    total_cod_refusals = serializers.SerializerMethodField()
    risk_tier = serializers.SerializerMethodField()
    device_reuse_flag = serializers.SerializerMethodField()
    joined_at = serializers.SerializerMethodField()

    def _get_profile(self, obj):
        profile = getattr(obj, "shopper_profile", None)
        if profile is None and obj.is_shopper:
            profile, _ = ShopperProfile.objects.get_or_create(
                user=obj,
                defaults={"customer_id": f"CUST-{obj.id + 1000}"},
            )
        return profile

    def get_customer_id(self, obj):
        p = self._get_profile(obj)
        return p.customer_id if p else f"CUST-{obj.id + 1000}"

    def get_merchant_id(self, obj):
        p = self._get_profile(obj)
        return str(p.merchant_id) if (p and p.merchant_id) else "merchant_1"

    def get_total_orders(self, obj):
        p = self._get_profile(obj)
        return p.total_orders if p else 0

    def get_total_returns(self, obj):
        p = self._get_profile(obj)
        return p.total_returns if p else 0

    def get_total_cod_refusals(self, obj):
        p = self._get_profile(obj)
        return p.total_cod_refusals if p else 0

    def get_risk_tier(self, obj):
        p = self._get_profile(obj)
        return p.risk_tier if p else "Low"

    def get_device_reuse_flag(self, obj):
        p = self._get_profile(obj)
        return p.device_reuse_flag if p else False

    def get_joined_at(self, obj):
        p = self._get_profile(obj)
        return p.joined_at if p else obj.created_at

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
