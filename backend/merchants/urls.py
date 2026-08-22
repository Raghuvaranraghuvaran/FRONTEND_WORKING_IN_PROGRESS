from django.urls import path

from . import views

urlpatterns = [
    path("register/", views.MerchantRegisterView.as_view(), name="merchant-register"),
    path("login/", views.MerchantLoginView.as_view(), name="merchant-login"),
    path("me/", views.MerchantMeView.as_view(), name="merchant-me"),
]
