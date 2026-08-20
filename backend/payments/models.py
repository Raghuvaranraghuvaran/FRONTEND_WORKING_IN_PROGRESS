from django.db import models

from common.models import TimestampedModel


class Payment(TimestampedModel):
    STATUS_PENDING = "pending"
    STATUS_PROCESSING = "processing"
    STATUS_PAID = "paid"
    STATUS_FAILED = "failed"
    STATUS_REJECTED = "rejected"
    STATUS_COD_PENDING = "cod_pending"
    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_PROCESSING, "Processing"),
        (STATUS_PAID, "Paid"),
        (STATUS_FAILED, "Failed"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_COD_PENDING, "COD Pending"),
    )

    order = models.OneToOneField(
        "orders.Order", on_delete=models.CASCADE, related_name="payment"
    )
    merchant = models.ForeignKey(
        "merchants.Merchant", on_delete=models.CASCADE, related_name="payments"
    )
    gateway = models.CharField(max_length=32, default="mock")
    gateway_payment_id = models.CharField(max_length=128, blank=True, default="")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    failure_reason = models.CharField(max_length=255, blank=True, default="")

    def __str__(self):
        return f"{self.order.order_number} payment ({self.status})"


class PaymentEvent(TimestampedModel):
    EVENT_CHOICES = (
        ("created", "Created"),
        ("processing", "Processing"),
        ("paid", "Paid"),
        ("failed", "Failed"),
        ("rejected", "Rejected"),
        ("cod_pending", "COD Pending"),
    )

    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name="events")
    event_type = models.CharField(max_length=32, choices=EVENT_CHOICES)
    gateway_event_id = models.CharField(max_length=128, blank=True, default="")
    payload = models.JSONField(default=dict)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["payment", "gateway_event_id"],
                name="unique_payment_event",
            )
        ]

    def __str__(self):
        return f"{self.payment_id} {self.event_type}"
