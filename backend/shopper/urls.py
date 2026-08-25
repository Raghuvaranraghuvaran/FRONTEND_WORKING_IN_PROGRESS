from django.urls import path
from . import views

urlpatterns = [
    path("size-recommendation/", views.SizeRecommendationAPIView.as_view(), name="shopper-size-recommendation"),
    path("returns/check-eligibility/", views.ReturnEligibilityAPIView.as_view(), name="shopper-return-eligibility"),
    path("returns/create/", views.ReturnCreateAPIView.as_view(), name="shopper-return-create"),
    path("returns/<str:pk>/tracking/", views.ReturnTrackingAPIView.as_view(), name="shopper-return-tracking"),
    path("cart/validate/", views.CartValidationAPIView.as_view(), name="shopper-cart-validate"),
    path("products/compare/", views.ProductComparisonAPIView.as_view(), name="shopper-product-compare"),
    path("wishlist/price-watch/", views.PriceWatchAPIView.as_view(), name="shopper-price-watch"),
    path("ai-assistant/", views.AIShoppingAssistantAPIView.as_view(), name="shopper-ai-assistant"),
]
