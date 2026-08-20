from django.urls import path

from . import views

urlpatterns = [
    path("send/", views.SendOTPView.as_view(), name="otp-send"),
    path("verify/", views.VerifyOTPView.as_view(), name="otp-verify"),
]
