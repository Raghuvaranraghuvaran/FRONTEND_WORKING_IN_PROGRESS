from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny

from .models import Category, Product
from .serializers import CategorySerializer, ProductDetailSerializer, ProductListSerializer


class CategoryListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.all().order_by("name")


class ProductListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True).select_related("category")
        category_id = self.request.query_params.get("category_id")
        query = self.request.query_params.get("query")
        if category_id and category_id != "all":
            qs = qs.filter(category_id=category_id)
        if query:
            qs = qs.filter(name__icontains=query) | qs.filter(description__icontains=query)
        return qs.order_by("-created_at")


class ProductDetailView(RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductDetailSerializer
    queryset = Product.objects.filter(is_active=True).select_related("category")
    lookup_field = "pk"
