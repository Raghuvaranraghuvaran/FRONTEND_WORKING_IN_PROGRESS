import secrets
import time

from django.db import models

from common.models import TimestampedModel


class OTPChallenge(TimestampedModel):
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="otp_challenges"
    )
    target = models.CharField(max_length=255, blank=True, default="")
    method = models.CharField(max_length=16, default="sms_otp")
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    attempts = models.PositiveIntegerField(default=0)
    verified_at = models.DateTimeField(null=True, blank=True)

    MAX_ATTEMPTS = 5
    TTL_SECONDS = 300

    def __str__(self):
        return f"{self.user.email} OTP ({self.method})"


class VerificationEvent(TimestampedModel):
    STATUS_CHOICES = (
        ("sent", "Sent"),
        ("failed", "Failed"),
        ("confirmed", "Confirmed"),
    )

    customer = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="verification_events"
    )
    method = models.CharField(max_length=16, default="sms_otp")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES)
    confidence = models.FloatField(default=0)

    def __str__(self):
        return f"{self.customer.email} {self.method} {self.status}"
