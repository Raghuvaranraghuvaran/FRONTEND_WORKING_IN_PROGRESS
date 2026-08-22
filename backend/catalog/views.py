from django.db import models
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny

from .models import Category, Product
from .serializers import CategorySerializer, ProductDetailSerializer, ProductListSerializer


class CategoryListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer

    def get_queryset(self):
        seen_names = set()
        unique_ids = []
        for cat in Category.objects.all().order_by("name", "created_at"):
            norm = cat.name.strip().lower()
            if norm not in seen_names:
                seen_names.add(norm)
                unique_ids.append(cat.id)
        return Category.objects.filter(id__in=unique_ids).order_by("name")


class ProductListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True).select_related("category", "merchant")
        category_param = self.request.query_params.get("category_id") or self.request.query_params.get("category")
        query = self.request.query_params.get("query")
        sort_by = self.request.query_params.get("sort")

        if category_param and category_param != "all":
            # Match by Category ID, Name, or Slug
            cat = Category.objects.filter(id=category_param).first()
            if cat:
                qs = qs.filter(category__name__iexact=cat.name)
            else:
                qs = qs.filter(
                    models.Q(category_id=category_param) |
                    models.Q(category__name__iexact=category_param) |
                    models.Q(category__slug__iexact=category_param)
                )

        if query:
            qs = qs.filter(models.Q(name__icontains=query) | models.Q(description__icontains=query) | models.Q(merchant__business_name__icontains=query))

        if sort_by == "price_asc":
            return qs.order_by("price")
        elif sort_by == "price_desc":
            return qs.order_by("-price")
        elif sort_by == "newest":
            return qs.order_by("-created_at")
        return qs.order_by("-created_at")


class ProductDetailView(RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductDetailSerializer
    queryset = Product.objects.filter(is_active=True).select_related("category")
    lookup_field = "pk"
