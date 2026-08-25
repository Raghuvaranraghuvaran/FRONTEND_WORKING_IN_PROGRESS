from decimal import Decimal
from rest_framework import serializers
from catalog.models import Category, Product, ProductVariant
from accounts.models import UserPreference, Wishlist, RewardWallet
from orders.models import Order, OrderItem
from returns.models import ReturnRequest


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "sku",
            "size",
            "color",
            "stock",
            "extra_price_delta",
        ]


class ShopperProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True, default="")
    merchant_name = serializers.CharField(source="merchant.business_name", read_only=True, default="")
    applicable_policy = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "price",
            "original_price",
            "stock",
            "image",
            "is_active",
            "is_returnable",
            "return_window_days",
            "rating",
            "review_count",
            "category",
            "category_name",
            "merchant_name",
            "variants",
            "applicable_policy",
        ]

    def get_applicable_policy(self, obj):
        return {
            "return_window_days": obj.return_window_days,
            "is_returnable": obj.is_returnable,
            "free_doorstep_pickup": True,
            "instant_exchange_available": True,
            "seal": "Protected by ReturnGuard",
        }


class SizeRecommendationRequestSerializer(serializers.Serializer):
    product_id = serializers.CharField(max_length=64)
    reference_brand = serializers.CharField(max_length=64)
    reference_size = serializers.CharField(max_length=32)
    fit_preference = serializers.ChoiceField(
        choices=["Tight", "Regular", "Relaxed"], default="Regular"
    )


class SizeRecommendationResponseSerializer(serializers.Serializer):
    recommended_size = serializers.CharField()
    confidence_score = serializers.IntegerField()
    in_stock = serializers.BooleanField()
    variant_id = serializers.IntegerField(allow_null=True)
    available_variants = ProductVariantSerializer(many=True)
    fit_guidance = serializers.CharField()


class ReturnEligibilityRequestSerializer(serializers.Serializer):
    order_item_id = serializers.IntegerField()


class ReturnEligibilityResponseSerializer(serializers.Serializer):
    eligible = serializers.BooleanField()
    reason = serializers.CharField()
    days_since_delivery = serializers.IntegerField()
    return_window_days = serializers.IntegerField()
    refund_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    exchange_options = ProductVariantSerializer(many=True)
    incentive_store_credit_bonus_percent = serializers.IntegerField(default=5)


class ReturnCreateSerializer(serializers.Serializer):
    order_id = serializers.CharField(max_length=64)
    order_item_id = serializers.IntegerField()
    type = serializers.ChoiceField(choices=["EXCHANGE", "REFUND", "STORE_CREDIT"])
    reason = serializers.CharField(max_length=64)
    notes = serializers.CharField(allow_blank=True, default="")
    exchange_variant_id = serializers.IntegerField(required=False, allow_null=True)
    refund_method = serializers.ChoiceField(
        choices=["original", "store_credit", "bank_transfer"], default="original"
    )
    pickup_slot = serializers.CharField(max_length=64, default="tomorrow_morning")
    photos = serializers.ListField(child=serializers.CharField(), required=False, default=list)


class CartItemValidationInputSerializer(serializers.Serializer):
    product_id = serializers.CharField(max_length=64, required=False)
    variant_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1, default=1)


class CartValidationRequestSerializer(serializers.Serializer):
    items = serializers.ListField(child=CartItemValidationInputSerializer())


class ProductComparisonRequestSerializer(serializers.Serializer):
    product_ids = serializers.ListField(
        child=serializers.CharField(max_length=64), min_length=2, max_length=4
    )


class PriceWatchRequestSerializer(serializers.Serializer):
    product_id = serializers.CharField(max_length=64)
    target_price = serializers.DecimalField(max_digits=10, decimal_places=2)


class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreference
        fields = [
            "preferred_categories",
            "preferred_brands",
            "default_size",
            "fit_preference",
            "budget_max",
        ]


class AIShoppingAssistantRequestSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=1000)
    conversation_history = serializers.ListField(
        child=serializers.DictField(), required=False, default=list
    )
