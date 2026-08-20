from django.db.models import Count, Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from catalog.models import Category
from common.permissions import IsMerchantAdmin
from common.response import success
from common.tenancy import get_merchant_from_user
from admin_api.models import SelfTuningSuggestion
from orders.models import Order
from returns.models import ReturnRequest


class AnalyticsOverviewView(APIView):
    permission_classes = [IsAuthenticated, IsMerchantAdmin]

    def get(self, request):
        merchant = get_merchant_from_user(request.user)

        orders = Order.objects.filter(merchant=merchant)
        returns = ReturnRequest.objects.filter(merchant=merchant)

        # Weekly trend approximated by bucketing created_at into ISO week.
        weekly_trend = []
        for row in (
            returns.values("created_at__week")
            .annotate(
                returns=Count("id"),
                flagged=Count("id", filter=~Q(status="approved")),
            )
            .order_by("created_at__week")
        ):
            weekly_trend.append(
                {"week": f"W{row['created_at__week']}", "returns": row["returns"], "flagged": row["flagged"]}
            )

        top_flagged_customers = [
            {"customer": row["customer_name"], "flagged": row["total"]}
            for row in (
                returns.filter(status="manual_review")
                .values("customer_name")
                .annotate(total=Count("id"))
                .order_by("-total")[:5]
            )
        ]

        category_return_rates = [
            {"category": c.name, "return_rate": self._category_rate(merchant, c)}
            for c in Category.objects.filter(merchant=merchant)
        ]

        suggestions = [
            {
                "id": s.id,
                "rule": s.rule,
                "label": s.label,
                "current_value": s.current_value,
                "suggested_value": s.suggested_value,
                "reason": s.reason,
                "confidence": s.confidence,
                "sample_size": s.sample_size,
                "window_days": s.window_days,
                "status": s.status,
            }
            for s in SelfTuningSuggestion.objects.filter(merchant=merchant).order_by("-created_at")
        ]

        return success(
            {
                "weeklyTrend": weekly_trend or [{"week": "W1", "returns": 0, "flagged": 0}],
                "topFlaggedCustomers": top_flagged_customers,
                "categoryReturnRates": category_return_rates,
                "selfTuningSuggestions": suggestions,
            }
        )

    def _category_rate(self, merchant, category):
        order_count = Order.objects.filter(merchant=merchant, items__product__category=category).distinct().count()
        if not order_count:
            return 0
        return_count = (
            ReturnRequest.objects.filter(merchant=merchant, return_lines__product__category=category)
            .distinct()
            .count()
        )
        return round((return_count / order_count) * 100, 1)
