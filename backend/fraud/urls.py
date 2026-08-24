from django.urls import path

from . import views

urlpatterns = [
    # Customer review screen (PDF Section 10)
    path(
        "customers/<str:customer_id>/review/",
        views.customer_review,
        name="fraud-customer-review",
    ),
    # Merchant action (PDF Section 5)
    path(
        "customers/<str:customer_id>/action/",
        views.merchant_action,
        name="fraud-merchant-action",
    ),
    # Restriction history
    path(
        "customers/<str:customer_id>/restrictions/",
        views.restriction_list,
        name="fraud-restriction-list",
    ),
    # Escalation history
    path(
        "customers/<str:customer_id>/escalation-history/",
        views.escalation_history_list,
        name="fraud-escalation-history",
    ),
    # Manual escalation / de-escalation
    path(
        "escalate/<str:customer_id>/",
        views.escalate_customer,
        name="fraud-escalate",
    ),
    path(
        "de-escalate/<str:customer_id>/",
        views.de_escalate_customer,
        name="fraud-de-escalate",
    ),
    # VIP Whitelist & Blacklist Rules (Feature 2)
    path(
        "rules/list/",
        views.merchant_list_rules,
        name="fraud-rules-list",
    ),
    path(
        "rules/list/<str:pk>/",
        views.merchant_list_rule_detail,
        name="fraud-rule-detail",
    ),
    # Loss Prevention & ROI Analytics (Feature 4)
    path(
        "analytics/roi/",
        views.fraud_roi_analytics,
        name="fraud-roi-analytics",
    ),
]

