import re
import uuid

from django.conf import settings
from django.db import models

from common.models import TimestampedModel


class Merchant(TimestampedModel):
    PLAN_CHOICES = (
        ("Pilot", "Pilot"),
        ("Growth", "Growth"),
        ("Scale", "Scale"),
    )

    id = models.CharField(primary_key=True, max_length=64, editable=False)
    business_name = models.CharField(max_length=255)
    store_slug = models.SlugField(max_length=128, unique=True)
    admin_email = models.EmailField()
    plan_tier = models.CharField(max_length=16, choices=PLAN_CHOICES, default="Pilot")

    def __str__(self):
        return self.business_name

    @classmethod
    def generate_id(cls, store_slug):
        prefix = re.sub(r"[^a-z0-9]", "", store_slug.lower())[:8].upper().ljust(3, "X")
        suffix = uuid.uuid4().hex[:6].upper()
        return f"RG-{prefix}-{suffix}"

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = self.generate_id(self.store_slug)
        super().save(*args, **kwargs)


class MerchantProfile(models.Model):
    """Links a merchant-admin user to the tenant they operate."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="merchant_profile",
    )
    merchant = models.ForeignKey(
        Merchant, on_delete=models.CASCADE, related_name="admins"
    )

    def __str__(self):
        return f"{self.user.email} -> {self.merchant_id}"
