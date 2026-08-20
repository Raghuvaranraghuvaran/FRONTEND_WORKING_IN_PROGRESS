from django.db import models

from common.models import TimestampedModel


class Invoice(TimestampedModel):
    STATUS_CHOICES = (
        ("generated", "Generated"),
        ("sent", "Sent"),
        ("void", "Void"),
    )

    order = models.OneToOneField(
        "orders.Order", on_delete=models.CASCADE, related_name="invoice"
    )
    invoice_number = models.CharField(max_length=64, unique=True)
    invoice_url = models.URLField(blank=True, default="")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="generated")
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.invoice_number

    @classmethod
    def generate_number(cls, order):
        return f"INV-{order.order_number.lstrip('#')}"
