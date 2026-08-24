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
    ESCALATION_LEVELS = (
        (0, "Normal"),
        (1, "Warning / Verification"),
        (2, "COD Restricted"),
        (3, "Prepaid + Manual Review"),
        (4, "Temporary Account Restriction"),
        (5, "Merchant Final Review"),
    )

    merchant = models.ForeignKey(
        "merchants.Merchant", on_delete=models.CASCADE, related_name="risk_profiles"
    )
    customer = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="risk_profiles"
    )
    risk_tier = models.CharField(max_length=16, default="Low")
    latest_score = models.PositiveIntegerField(default=0)
    device_reuse_flag = models.BooleanField(default=False)
    escalation_level = models.PositiveSmallIntegerField(default=0, choices=ESCALATION_LEVELS)
    confirmed_violations = models.PositiveIntegerField(default=0)
    restriction_count = models.PositiveIntegerField(default=0)

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


class CustomerRestriction(TimestampedModel):
    """Tracks restrictions applied to a customer by a merchant."""

    RESTRICTION_TYPES = (
        ("cod_limit", "COD Limit"),
        ("order_value_limit", "Order Value Limit"),
        ("variant_limit", "Variant Limit"),
        ("prepaid_only", "Prepaid Only"),
        ("cod_suspended", "COD Suspended"),
        ("account_restricted", "Account Restricted"),
        ("high_value_restricted", "High-Value Order Restricted"),
    )
    STATUS_CHOICES = (
        ("active", "Active"),
        ("expired", "Expired"),
        ("removed", "Removed by Merchant"),
    )

    merchant = models.ForeignKey(
        "merchants.Merchant", on_delete=models.CASCADE, related_name="customer_restrictions"
    )
    customer = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="restrictions"
    )
    restriction_type = models.CharField(max_length=32, choices=RESTRICTION_TYPES)
    reason = models.TextField(blank=True, default="")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="active")
    threshold_value = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Optional cap value (e.g. max COD amount or max order value)."
    )
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)
    applied_by = models.CharField(max_length=255, default="system")
    removed_by = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.restriction_type} on {self.customer_id} ({self.status})"


class EscalationHistory(TimestampedModel):
    """Records every escalation-level change for a customer."""

    merchant = models.ForeignKey(
        "merchants.Merchant", on_delete=models.CASCADE, related_name="escalation_history"
    )
    customer = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="escalation_history"
    )
    previous_level = models.PositiveSmallIntegerField(default=0)
    new_level = models.PositiveSmallIntegerField(default=0)
    trigger_event = models.CharField(max_length=255)
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.customer_id} L{self.previous_level}→L{self.new_level}"
