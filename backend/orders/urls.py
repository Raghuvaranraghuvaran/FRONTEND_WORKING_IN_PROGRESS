from django.urls import path

from . import views

urlpatterns = [
    path("checkout/", views.CheckoutView.as_view(), name="checkout"),
    path("", views.ShopperOrderListView.as_view(), name="order-list"),
    path("<str:pk>/", views.ShopperOrderDetailView.as_view(), name="order-detail"),
    path("<str:pk>/track/", views.TrackOrderView.as_view(), name="order-track"),
    path("<str:pk>/doorstep-refusal/", views.ReportDoorstepRefusalView.as_view(), name="doorstep-refusal"),
    path("<str:pk>/status/", views.UpdateOrderStatusView.as_view(), name="order-status-update"),
]

