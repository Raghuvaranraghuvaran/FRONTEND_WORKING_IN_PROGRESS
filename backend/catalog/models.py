import uuid

from django.db import models

from common.models import TimestampedModel


class Category(TimestampedModel):
    id = models.CharField(primary_key=True, max_length=64, editable=False)
    merchant = models.ForeignKey(
        "merchants.Merchant", on_delete=models.CASCADE, related_name="categories"
    )
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True, default="")
    slug = models.SlugField(max_length=128, blank=True)

    class Meta:
        verbose_name_plural = "categories"
        unique_together = ("merchant", "name")

    def save(self, *args, **kwargs):
        if not self.id:
            import uuid
            m_tag = str(getattr(self, "merchant_id", None) or uuid.uuid4().hex[:8])[:16]
            slug_tag = self.slug or "".join(ch for ch in self.name.lower() if ch.isalnum() or ch == "-") or uuid.uuid4().hex[:8]
            self.id = f"cat_{m_tag}_{slug_tag}"[:64]
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(TimestampedModel):
    id = models.CharField(primary_key=True, max_length=64, editable=False)
    merchant = models.ForeignKey(
        "merchants.Merchant", on_delete=models.CASCADE, related_name="products"
    )
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, related_name="products"
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, blank=True)
    description = models.TextField(blank=True, default="")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    original_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Original MRP for strike-through display",
    )
    stock = models.PositiveIntegerField(default=0)
    image = models.URLField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    is_returnable = models.BooleanField(default=True)
    return_window_days = models.PositiveIntegerField(default=30)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=4.5)
    review_count = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = f"prod_{uuid.uuid4().hex[:8]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ProductVariant(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="variants"
    )
    sku = models.CharField(max_length=64, unique=True)
    size = models.CharField(max_length=32, help_text="e.g. S, M, L, XL, 8, 9, 10")
    color = models.CharField(max_length=64, blank=True, default="")
    stock = models.PositiveIntegerField(default=0)
    extra_price_delta = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Additional cost on top of base product price",
    )

    class Meta:
        unique_together = ("product", "size", "color")
        indexes = [models.Index(fields=["product", "stock"])]

    def __str__(self):
        parts = [self.product.name, self.size]
        if self.color:
            parts.append(self.color)
        return " / ".join(parts)

