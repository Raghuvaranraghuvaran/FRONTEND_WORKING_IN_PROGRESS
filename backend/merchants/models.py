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
    merchant_username = models.CharField(max_length=64, unique=True, null=True, blank=True, db_index=True)
    business_name = models.CharField(max_length=255)
    store_slug = models.SlugField(max_length=128, unique=True)
    admin_email = models.EmailField()
    plan_tier = models.CharField(max_length=16, choices=PLAN_CHOICES, default="Pilot")
    return_window_days = models.PositiveIntegerField(default=7)

    def __str__(self):
        return f"{self.business_name} ({self.merchant_username or self.id})"

    @classmethod
    def generate_unique_merchant_username(cls, business_name):
        import secrets
        from django.contrib.auth import get_user_model
        User = get_user_model()
        clean = re.sub(r"[^A-Za-z0-9]", "", str(business_name or "")).upper()
        base = clean[:12] if clean else "MERCHANT"
        while True:
            suffix = f"{secrets.randbelow(9000) + 1000}"
            candidate = f"{base}{suffix}"
            if not cls.objects.filter(merchant_username=candidate).exists() and not User.objects.filter(merchant_username=candidate).exists():
                return candidate

    @classmethod
    def generate_id(cls, store_slug):
        prefix = re.sub(r"[^a-z0-9]", "", store_slug.lower())[:8].upper().ljust(3, "X")
        suffix = uuid.uuid4().hex[:6].upper()
        return f"RG-{prefix}-{suffix}"

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = self.generate_id(self.store_slug)
        if not self.merchant_username:
            self.merchant_username = self.generate_unique_merchant_username(self.business_name)
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
