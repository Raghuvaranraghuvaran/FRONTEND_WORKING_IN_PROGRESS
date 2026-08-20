from django.urls import path

from . import views

urlpatterns = [
    path("<str:pk>/", views.InvoiceDetailView.as_view(), name="invoice-detail"),
]
