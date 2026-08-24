from django.db import models

from common.models import TimestampedModel


class ReturnRequest(TimestampedModel):
    STATUS_CHOICES = (
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("manual_review", "Manual Review"),
        ("product_returned", "Product Returned"),
        ("refund_processed", "Refund Processed"),
    )
    OUTCOME_CHOICES = (
        ("auto_approved", "Auto Approved"),
        ("pending_review", "Pending Review"),
        ("legitimate_return", "Legitimate Return"),
        ("confirmed_fraud", "Confirmed Fraud"),
        ("product_returned", "Product Returned"),
        ("refund_processed", "Refund Processed"),
    )
    REFUND_METHOD_CHOICES = (
        ("original", "Original Payment Method"),
        ("store_credit", "Store Credit / Reward Points"),
        ("bank_transfer", "Direct Bank Transfer / UPI"),
    )

    order = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, related_name="returns"
    )
    merchant = models.ForeignKey(
        "merchants.Merchant", on_delete=models.CASCADE, related_name="returns"
    )
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="returns"
    )
    customer_name = models.CharField(max_length=255)
    reason = models.CharField(max_length=64)
    note = models.TextField(blank=True, default="")
    refund_method = models.CharField(max_length=32, choices=REFUND_METHOD_CHOICES, default="original")
    images = models.JSONField(default=list)
    risk_tier = models.CharField(max_length=16, default="Low")
    risk_score = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="manual_review")
    outcome = models.CharField(max_length=32, choices=OUTCOME_CHOICES, default="pending_review")
    verification_status = models.CharField(max_length=16, default="Pending")
    verification_method = models.CharField(max_length=16, default="unverified")
    risk_context = models.TextField(blank=True, default="")
    signals = models.JSONField(default=list)
    pickup_slot = models.CharField(max_length=64, blank=True, default="")
    proof_image_url = models.TextField(blank=True, default="", help_text="Unboxing photo / return proof image URL")
    proof_verified = models.BooleanField(default=False)
    reviewed_by = models.CharField(max_length=255, blank=True, default="")
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Return {self.order.order_number} ({self.status})"


class ReturnLine(models.Model):
    return_request = models.ForeignKey(
        ReturnRequest, on_delete=models.CASCADE, related_name="return_lines"
    )
    product = models.ForeignKey(
        "catalog.Product", on_delete=models.SET_NULL, null=True
    )
    name = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.name} x{self.quantity}"


class ReturnEvent(models.Model):
    return_request = models.ForeignKey(
        ReturnRequest, on_delete=models.CASCADE, related_name="timeline"
    )
    label = models.CharField(max_length=255)
    at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("at", "id")

    def __str__(self):
        return self.label


class DoorstepProof(models.Model):
    return_request = models.ForeignKey(
        ReturnRequest, on_delete=models.CASCADE, related_name="proofs"
    )
    proof_type = models.CharField(max_length=32, default="signature")
    file = models.FileField(upload_to="proof/", blank=True, null=True)
    metadata = models.JSONField(default=dict)

    def __str__(self):
        return f"Proof for {self.return_request_id}"


class ReviewDecision(models.Model):
    ACTION_CHOICES = (("approve", "Approve"), ("reject", "Reject"))

    return_request = models.OneToOneField(
        ReturnRequest, on_delete=models.CASCADE, related_name="review_decision"
    )
    action = models.CharField(max_length=16, choices=ACTION_CHOICES)
    reviewed_by = models.CharField(max_length=255)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.return_request_id} {self.action}"
