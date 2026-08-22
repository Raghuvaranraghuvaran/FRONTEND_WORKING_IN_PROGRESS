from django.urls import path

from . import views

urlpatterns = [
    path("", views.MerchantListView.as_view(), name="merchant-list"),
    path("register/", views.MerchantRegisterView.as_view(), name="merchant-register"),
    path("login/", views.MerchantLoginView.as_view(), name="merchant-login"),
    path("google/", views.MerchantGoogleLoginView.as_view(), name="merchant-google-login"),
    path("request-otp/", views.MerchantOTPRequestView.as_view(), name="merchant-request-otp"),
    path("verify-otp/", views.MerchantOTPVerifyView.as_view(), name="merchant-verify-otp"),
    path("me/", views.MerchantMeView.as_view(), name="merchant-me"),
]
