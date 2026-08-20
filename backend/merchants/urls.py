from django.urls import path

from . import views

urlpatterns = [
    path("", views.MerchantListView.as_view(), name="merchant-list"),
    path("login/", views.MerchantLoginView.as_view(), name="merchant-login"),
    path("me/", views.MerchantMeView.as_view(), name="merchant-me"),
]
