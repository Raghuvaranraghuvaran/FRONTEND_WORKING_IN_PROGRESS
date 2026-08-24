from django.db import models

from common.models import TimestampedModel


class AuditLog(TimestampedModel):
    merchant = models.ForeignKey(
        "merchants.Merchant", on_delete=models.CASCADE, related_name="audit_logs"
    )
    customer = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs"
    )
    actor = models.CharField(max_length=255)
    action = models.CharField(max_length=64)
    event_type = models.CharField(max_length=64, blank=True, default="")
    target = models.CharField(max_length=255)
    notes = models.TextField(blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.actor} {self.action} {self.target}"
