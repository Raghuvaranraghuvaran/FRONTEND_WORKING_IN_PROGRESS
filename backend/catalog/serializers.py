from rest_framework import serializers

from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "description")


class ProductListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ("id", "merchant_id", "category_id", "name", "price", "stock", "image", "description")


class ProductDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ("id", "merchant_id", "category_id", "name", "price", "stock", "image", "description", "is_active")
