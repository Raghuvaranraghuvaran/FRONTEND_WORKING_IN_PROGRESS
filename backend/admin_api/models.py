from django.conf import settings
from django.db import models

from common.models import TimestampedModel


class DeliveryAgent(TimestampedModel):
    RISK_LEVEL_CHOICES = (
        ("HIGH", "High"),
        ("MEDIUM", "Medium"),
        ("LOW", "Low"),
    )

    merchant = models.ForeignKey(
        "merchants.Merchant", on_delete=models.CASCADE, related_name="delivery_agents"
    )
    name = models.CharField(max_length=255)
    avatar_url = models.CharField(max_length=512, blank=True, default="")
    route = models.CharField(max_length=255)
    location_name = models.CharField(max_length=255, blank=True, default="")
    pincode = models.CharField(max_length=16, blank=True, default="")
    total_deliveries = models.PositiveIntegerField(default=0)
    total_returns_handled = models.PositiveIntegerField(default=0)
    return_rate = models.FloatField(default=0.0)
    expected_return_rate = models.FloatField(default=0.0)
    flagged_return_count = models.PositiveIntegerField(default=0)
    risk_flag = models.CharField(max_length=16, default="Monitor")
    current_risk_level = models.CharField(max_length=16, choices=RISK_LEVEL_CHOICES, default="MEDIUM")
    is_under_investigation = models.BooleanField(default=False)

    @property
    def anomaly_gap(self):
        return round(self.return_rate - self.expected_return_rate, 2)

    def __str__(self):
        return f"{self.name} ({self.route})"


class AgentRiskSnapshot(TimestampedModel):
    agent = models.ForeignKey(
        DeliveryAgent, on_delete=models.CASCADE, related_name="risk_snapshots"
    )
    total_deliveries = models.PositiveIntegerField(default=0)
    total_returns = models.PositiveIntegerField(default=0)
    flagged_count = models.PositiveIntegerField(default=0)
    actual_return_rate = models.FloatField(default=0.0)
    expected_baseline_rate = models.FloatField(default=0.0)
    anomaly_gap = models.FloatField(default=0.0)
    status_note = models.TextField(blank=True, default="")
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="agent_reviews"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Snapshot for {self.agent.name} at {self.created_at}"


class AgentActivityLog(TimestampedModel):
    EVENT_TYPES = (
        ("ANOMALY_DETECTED", "Anomaly Detected"),
        ("INVESTIGATION_STARTED", "Investigation Started"),
        ("HUMAN_SIGN_OFF", "Human Sign-off"),
        ("BASELINE_UPDATED", "Baseline Updated"),
        ("FLAGGED", "Flagged for Review"),
    )

    agent = models.ForeignKey(
        DeliveryAgent, on_delete=models.CASCADE, related_name="activity_logs"
    )
    event_type = models.CharField(max_length=32, choices=EVENT_TYPES, default="ANOMALY_DETECTED")
    message = models.TextField()

    def __str__(self):
        return f"{self.agent.name} - {self.event_type}"


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
