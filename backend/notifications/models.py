from django.db import models

from common.models import TimestampedModel


class EmailDelivery(TimestampedModel):
    STATUS_CHOICES = (
        ("queued", "Queued"),
        ("sent", "Sent"),
        ("failed", "Failed"),
    )

    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="email_deliveries"
    )
    event_type = models.CharField(max_length=64)
    related_order = models.ForeignKey(
        "orders.Order", on_delete=models.SET_NULL, null=True, blank=True
    )
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="queued")
    sent_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.email} {self.event_type} ({self.status})"


class InAppNotification(TimestampedModel):
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="notifications"
    )
    type = models.CharField(max_length=64)
    channel = models.CharField(max_length=16, default="in_app")
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True, default="")
    read = models.BooleanField(default=False)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return self.title
