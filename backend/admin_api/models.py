from django.db import models

from common.models import TimestampedModel


class DeliveryAgent(TimestampedModel):
    merchant = models.ForeignKey(
        "merchants.Merchant", on_delete=models.CASCADE, related_name="delivery_agents"
    )
    name = models.CharField(max_length=255)
    route = models.CharField(max_length=255)
    pincode = models.CharField(max_length=16, blank=True, default="")
    total_deliveries = models.PositiveIntegerField(default=0)
    total_returns_handled = models.PositiveIntegerField(default=0)
    return_rate = models.FloatField(default=0)
    expected_return_rate = models.FloatField(default=0)
    flagged_return_count = models.PositiveIntegerField(default=0)
    risk_flag = models.CharField(max_length=16, default="Monitor")

    def __str__(self):
        return self.name


class SelfTuningSuggestion(TimestampedModel):
    STATUS_CHOICES = (
        ("suggested", "Suggested"),
        ("applied", "Applied"),
        ("dismissed", "Dismissed"),
    )

    merchant = models.ForeignKey(
        "merchants.Merchant", on_delete=models.CASCADE, related_name="self_tuning_suggestions"
    )
    rule = models.CharField(max_length=64)
    label = models.CharField(max_length=255)
    current_value = models.FloatField()
    suggested_value = models.FloatField()
    reason = models.TextField(blank=True, default="")
    confidence = models.FloatField(default=0)
    sample_size = models.PositiveIntegerField(default=0)
    window_days = models.PositiveIntegerField(default=14)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="suggested")

    def __str__(self):
        return self.label
