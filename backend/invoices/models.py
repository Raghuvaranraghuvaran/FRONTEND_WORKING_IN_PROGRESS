from django.db import models

from common.models import TimestampedModel


class Invoice(TimestampedModel):
    STATUS_CHOICES = (
        ("generated", "Generated"),
        ("sent", "Sent"),
        ("void", "Void"),
    )
    
    EMAIL_STATUS_CHOICES = (
        ("pending", "Pending"),
        ("sent", "Sent"),
        ("failed", "Failed"),
    )

    order = models.OneToOneField(
        "orders.Order", on_delete=models.CASCADE, related_name="invoice"
    )
    invoice_number = models.CharField(max_length=64, unique=True)
    invoice_url = models.URLField(blank=True, default="")
    pdf_file = models.FileField(upload_to="invoices/", blank=True, null=True, help_text="Generated invoice PDF")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="generated")
    generated_at = models.DateTimeField(auto_now_add=True)
    
    # Email delivery tracking
    email_status = models.CharField(max_length=16, choices=EMAIL_STATUS_CHOICES, default="pending")
    email_sent_at = models.DateTimeField(null=True, blank=True)
    email_attempts = models.PositiveIntegerField(default=0)
    email_last_error = models.TextField(blank=True, default="")
    email_last_attempt_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.invoice_number

    @classmethod
    def generate_number(cls, order):
        year = order.created_at.year
        return f"INV-{year}-{order.order_number.lstrip('#')}"

    class Meta:
        ordering = ["-generated_at"]
