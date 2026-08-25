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


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .ai_assistant import generate_ai_assistant_response


class AIAssistantChatView(APIView):
    """
    AI Shopping Assistant endpoint.
    Accepts natural-language requests, parses context, and returns
    curated real catalog product cards, follow-ups, and comparisons.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        message = request.data.get("message", "")
        context = request.data.get("context", {})
        cart = request.data.get("cart", [])
        
        try:
            result = generate_ai_assistant_response(message=message, context=context, cart_items=cart)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {
                    "message": "Sorry, I couldn't load the products right now. Please try again.",
                    "products": [],
                    "quick_options": ["Find under ₹1000", "Show trending products"],
                    "context": context,
                    "state": "error",
                    "error": str(e),
                },
                status=status.HTTP_200_OK,
            )

