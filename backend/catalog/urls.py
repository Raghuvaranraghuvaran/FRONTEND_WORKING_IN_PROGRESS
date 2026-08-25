from django.urls import path

from . import views

urlpatterns = [
    path("", views.ProductListView.as_view(), name="product-list"),
    path("categories/", views.CategoryListView.as_view(), name="category-list"),
    path("ai-assistant/", views.AIAssistantChatView.as_view(), name="ai-assistant"),
    path("<str:pk>/", views.ProductDetailView.as_view(), name="product-detail"),
]
