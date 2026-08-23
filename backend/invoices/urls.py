from django.urls import path
from . import views

urlpatterns = [
    path("<int:invoice_id>/download/", views.DownloadInvoiceView.as_view(), name="invoice-download"),
    path("<int:invoice_id>/", views.InvoiceDetailView.as_view(), name="invoice-detail"),
    path("merchant/<int:invoice_id>/download/", views.MerchantInvoiceDownloadView.as_view(), name="merchant-invoice-download"),
]
