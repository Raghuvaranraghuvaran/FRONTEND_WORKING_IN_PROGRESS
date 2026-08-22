
from django.urls import path

from . import views

urlpatterns = [
    path("dashboard/", views.MerchantDashboardView.as_view(), name="admin-dashboard"),
    path("orders/", views.MerchantOrdersView.as_view(), name="admin-orders"),
    path("customers/", views.MerchantCustomersView.as_view(), name="admin-customers"),
    path("customers/<str:customer_id>/", views.CustomerRiskProfileView.as_view(), name="admin-customer-profile"),
    path("flagged-cases/", views.MerchantFlaggedCasesView.as_view(), name="admin-flagged-cases"),
    path("returns/<str:pk>/review/", views.ReviewReturnView.as_view(), name="admin-review-return"),
    path("audit-log/", views.MerchantAuditLogView.as_view(), name="admin-audit-log"),
    path("fraud-config/", views.FraudConfigView.as_view(), name="admin-fraud-config"),
    path("self-tuning/<str:pk>/apply/", views.ApplySelfTuningView.as_view(), name="admin-self-tuning-apply"),
    path("delivery-agents/", views.DeliveryAgentsView.as_view(), name="admin-delivery-agents"),
    path("products/bulk/", views.MerchantProductBulkUploadView.as_view(), name="admin-products-bulk"),
    path("products/", views.MerchantProductsView.as_view(), name="admin-products"),
    path("products/<str:pk>/", views.MerchantProductDetailView.as_view(), name="admin-product-detail"),
    path("categories/", views.MerchantCategoriesView.as_view(), name="admin-categories"),
]
