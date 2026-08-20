from django.db import models

from common.models import TimestampedModel


class FraudConfiguration(TimestampedModel):
    merchant = models.OneToOneField(
        "merchants.Merchant", on_delete=models.CASCADE, related_name="fraud_config"
    )
    rule_version = models.CharField(max_length=64, default="rg-rules-v0.4")
    weights = models.JSONField(default=dict)
    thresholds = models.JSONField(default=dict)
    review_enabled = models.BooleanField(default=True)

    def __str__(self):
        return f"Fraud config for {self.merchant_id}"


class CustomerRiskProfile(TimestampedModel):
    merchant = models.ForeignKey(
        "merchants.Merchant", on_delete=models.CASCADE, related_name="risk_profiles"
    )
    customer = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="risk_profiles"
    )
    risk_tier = models.CharField(max_length=16, default="Low")
    latest_score = models.PositiveIntegerField(default=0)
    device_reuse_flag = models.BooleanField(default=False)

    class Meta:
        unique_together = ("merchant", "customer")

    def __str__(self):
        return f"{self.customer.email} risk profile"


class RiskScoreEvent(TimestampedModel):
    merchant = models.ForeignKey(
        "merchants.Merchant", on_delete=models.CASCADE, related_name="risk_score_events"
    )
    customer = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="risk_score_events"
    )
    score = models.PositiveIntegerField(default=0)
    tier = models.CharField(max_length=16)
    rule_version = models.CharField(max_length=64, default="rg-rules-v0.4")
    signals = models.JSONField(default=list)
    context = models.CharField(max_length=32, default="order")

    def __str__(self):
        return f"{self.customer.email} score {self.score}"
