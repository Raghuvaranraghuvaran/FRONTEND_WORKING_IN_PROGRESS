from django.urls import path

from . import views

urlpatterns = [
    path("webhook/", views.PaymentWebhookView.as_view(), name="payment-webhook"),
    path("process/", views.ProcessPaymentView.as_view(), name="payment-process"),
    path("simulate-result/", views.SimulatePaymentResultView.as_view(), name="payment-simulate-result"),
    path("<int:payment_id>/status/", views.PaymentStatusView.as_view(), name="payment-status"),
    path("<int:payment_id>/retry/", views.RetryPaymentView.as_view(), name="payment-retry"),
]
