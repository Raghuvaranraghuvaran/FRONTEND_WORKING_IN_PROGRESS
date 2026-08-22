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
    description = models.TextField(blank=True, default="")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    image = models.URLField(blank=True, default="")
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = f"prod_{uuid.uuid4().hex[:8]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

