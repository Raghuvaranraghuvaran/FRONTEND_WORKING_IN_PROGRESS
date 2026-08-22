from rest_framework import serializers

from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "description")


class ProductListSerializer(serializers.ModelSerializer):
    merchant_name = serializers.CharField(source="merchant.business_name", read_only=True, default="")

    class Meta:
        model = Product
        fields = ("id", "merchant_id", "merchant_name", "category_id", "name", "price", "stock", "image", "description")


class ProductDetailSerializer(serializers.ModelSerializer):
    merchant_name = serializers.CharField(source="merchant.business_name", read_only=True, default="")

    class Meta:
        model = Product
        fields = ("id", "merchant_id", "merchant_name", "category_id", "name", "price", "stock", "image", "description", "is_active")
