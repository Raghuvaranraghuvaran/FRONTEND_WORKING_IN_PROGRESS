from django.db import models

from common.models import TimestampedModel


class Payment(TimestampedModel):
    # Payment statuses
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

    # Payment methods
    METHOD_COD = "COD"
    METHOD_UPI = "UPI"
    METHOD_CREDIT_CARD = "CREDIT_CARD"
    METHOD_DEBIT_CARD = "DEBIT_CARD"
    METHOD_NET_BANKING = "NET_BANKING"
    METHOD_MOBILE_BANKING = "MOBILE_BANKING"
    METHOD_CHOICES = (
        (METHOD_COD, "Cash on Delivery"),
        (METHOD_UPI, "UPI"),
        (METHOD_CREDIT_CARD, "Credit Card"),
        (METHOD_DEBIT_CARD, "Debit Card"),
        (METHOD_NET_BANKING, "Net Banking"),
        (METHOD_MOBILE_BANKING, "Mobile Banking"),
    )

    order = models.OneToOneField(
        "orders.Order", on_delete=models.CASCADE, related_name="payment"
    )
    merchant = models.ForeignKey(
        "merchants.Merchant", on_delete=models.CASCADE, related_name="payments"
    )
    payment_method = models.CharField(max_length=32, choices=METHOD_CHOICES, default=METHOD_COD)
    gateway = models.CharField(max_length=32, default="mock")
    gateway_payment_id = models.CharField(max_length=128, blank=True, default="")
    transaction_id = models.CharField(max_length=128, blank=True, default="", help_text="Demo transaction ID for display")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="INR")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    failure_reason = models.CharField(max_length=255, blank=True, default="")
    is_demo_payment = models.BooleanField(default=True, help_text="True for simulated payments")
    
    # Payment method specific data (stored as JSON for flexibility)
    payment_details = models.JSONField(default=dict, blank=True, help_text="Store UPI ID, last 4 digits of card, bank name, etc.")

    def __str__(self):
        return f"{self.order.order_number} payment ({self.status})"

    class Meta:
        ordering = ["-created_at"]


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
                condition=models.Q(gateway_event_id__gt=""),
            )
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.payment_id} {self.event_type}"
