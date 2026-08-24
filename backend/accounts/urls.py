from django.urls import path

from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("google/", views.GoogleLoginView.as_view(), name="google-login"),
    path("request-otp/", views.LoginOTPRequestView.as_view(), name="request-login-otp"),
    path("verify-otp/", views.LoginOTPVerifyView.as_view(), name="verify-login-otp"),
    path("forgot-password/", views.ForgotPasswordRequestView.as_view(), name="forgot-password"),
    path("reset-password/", views.ResetPasswordView.as_view(), name="reset-password"),
    path("refresh/", views.RefreshView.as_view(), name="refresh"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("me/", views.MeView.as_view(), name="me"),
    path("addresses/", views.AddressListView.as_view(), name="addresses"),
    path("addresses/<str:pk>/", views.AddressDetailView.as_view(), name="address-detail"),
]
