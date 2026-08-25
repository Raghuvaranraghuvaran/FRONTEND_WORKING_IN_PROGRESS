from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from common.models import TimestampedModel
from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin, TimestampedModel):
    ROLE_SHOPPER = "shopper"
    ROLE_MERCHANT_ADMIN = "merchant_admin"
    ROLE_CHOICES = (
        (ROLE_SHOPPER, "Shopper"),
        (ROLE_MERCHANT_ADMIN, "Merchant Admin"),
    )

    email = models.EmailField(unique=True)
    merchant_username = models.CharField(max_length=64, unique=True, null=True, blank=True, db_index=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=32, blank=True, default="")
    role = models.CharField(max_length=32, choices=ROLE_CHOICES, default=ROLE_SHOPPER)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    @property
    def is_shopper(self):
        return self.role == self.ROLE_SHOPPER

    @property
    def is_merchant_admin(self):
        return self.role == self.ROLE_MERCHANT_ADMIN

    def __str__(self):
        return self.email


class ShopperProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="shopper_profile"
    )
    merchant = models.ForeignKey(
        "merchants.Merchant", on_delete=models.CASCADE, related_name="shoppers", null=True, blank=True
    )
    customer_id = models.CharField(max_length=64, blank=True, default="")
    total_orders = models.PositiveIntegerField(default=0)
    total_returns = models.PositiveIntegerField(default=0)
    total_cod_refusals = models.PositiveIntegerField(default=0)
    successful_deliveries = models.PositiveIntegerField(default=0)
    multiple_variant_orders = models.PositiveIntegerField(default=0)
    high_value_cod_count = models.PositiveIntegerField(default=0)
    address_mismatch_count = models.PositiveIntegerField(default=0)
    reward_points = models.PositiveIntegerField(default=1000)
    gender = models.CharField(max_length=32, blank=True, default="Male")
    profile_photo = models.TextField(blank=True, default="")
    risk_tier = models.CharField(max_length=16, default="Low")
    device_reuse_flag = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} shopper profile"


class Address(TimestampedModel):
    shopper = models.ForeignKey(
        ShopperProfile, on_delete=models.CASCADE, related_name="addresses"
    )
    label = models.CharField(max_length=64, default="Home")
    line = models.TextField()
    is_primary = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.label}: {self.line[:40]}"


class UserPreference(models.Model):
    FIT_CHOICES = (
        ("Tight", "Tight"),
        ("Regular", "Regular"),
        ("Relaxed", "Relaxed"),
    )

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="preference"
    )
    preferred_categories = models.JSONField(default=list, blank=True)
    preferred_brands = models.JSONField(default=list, blank=True)
    default_size = models.CharField(max_length=16, blank=True, default="")
    fit_preference = models.CharField(
        max_length=16, choices=FIT_CHOICES, default="Regular"
    )
    budget_max = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    def __str__(self):
        return f"{self.user.email} preferences"


class Wishlist(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="wishlist"
    )
    products = models.ManyToManyField(
        "catalog.Product", blank=True, related_name="wishlisted_by"
    )
    target_prices = models.JSONField(
        default=dict, blank=True,
        help_text="Map of product_id → target_price for price-watch alerts",
    )

    def __str__(self):
        return f"{self.user.email} wishlist"


class RewardWallet(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="reward_wallet"
    )
    points = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.user.email} wallet ({self.points} pts)"

