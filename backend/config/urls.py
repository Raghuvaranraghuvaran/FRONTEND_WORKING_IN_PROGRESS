from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def api_root(request):
    return JsonResponse(
        {
            "service": "ReturnGuard API",
            "status": "ok",
            "endpoints": [
                "/api/auth/",
                "/api/merchants/",
                "/api/products/",
                "/api/orders/",
                "/api/payments/",
                "/api/invoices/",
                "/api/returns/",
                "/api/verification/",
                "/api/notifications/",
                "/api/admin/",
                "/api/analytics/",
                "/api/fraud/",
            ],
        }
    )


urlpatterns = [
    path("", api_root),
    path("admin/", admin.site.urls),
    path("api", api_root),
    path("api/", api_root),
    path("api/auth/", include("accounts.urls")),
    path("api/merchants/", include("merchants.urls")),
    path("api/products/", include("catalog.urls")),
    path("api/orders/", include("orders.urls")),
    path("api/payments/", include("payments.urls")),
    path("api/invoices/", include("invoices.urls")),
    path("api/returns/", include("returns.urls")),
    path("api/verification/", include("verification.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/admin/", include("admin_api.urls")),
    path("api/analytics/", include("analytics.urls")),
    path("api/fraud/", include("fraud.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
