from django.urls import path

from . import views

urlpatterns = [
    path("register/", views.MerchantRegisterView.as_view(), name="merchant-register"),
    path("login/", views.MerchantLoginView.as_view(), name="merchant-login"),
    path("request-otp/", views.MerchantOTPRequestView.as_view(), name="merchant-request-otp"),
    path("verify-otp/", views.MerchantOTPVerifyView.as_view(), name="merchant-verify-otp"),
    path("change-password/", views.MerchantChangePasswordView.as_view(), name="merchant-change-password"),
    path("me/", views.MerchantMeView.as_view(), name="merchant-me"),
]
