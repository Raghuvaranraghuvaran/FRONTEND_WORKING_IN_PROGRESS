from django.db import models

from common.models import TimestampedModel


class ReturnRequest(TimestampedModel):
    STATUS_CHOICES = (
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("manual_review", "Manual Review"),
        ("product_returned", "Product Returned"),
        ("refund_processed", "Refund Processed"),
        ("hold", "Hold — Awaiting Verification"),
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

    TYPE_CHOICES = (
        ("EXCHANGE", "Smart Exchange"),
        ("REFUND", "Refund"),
        ("STORE_CREDIT", "Store Credit"),
        ("REPLACEMENT", "Replacement"),
    )

    CONDITION_CHOICES = (
        ("unused", "Unused"),
        ("used", "Used"),
        ("damaged", "Damaged"),
        ("soiled", "Soiled"),
        ("tampered", "Tampered / Seal Broken"),
        ("tag_removed", "Return Tag Removed"),
        ("unknown", "Unknown / Not Inspected"),
    )

    PACKAGING_CHOICES = (
        ("original_intact", "Original Packaging — Intact"),
        ("original_damaged", "Original Packaging — Damaged"),
        ("different_box", "Different / Wrong Packaging"),
        ("no_packaging", "No Packaging"),
        ("not_inspected", "Not Yet Inspected"),
    )

    order = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, related_name="returns"
    )
    order_item = models.ForeignKey(
        "orders.OrderItem", on_delete=models.SET_NULL, null=True, blank=True, related_name="returns"
    )
    merchant = models.ForeignKey(
        "merchants.Merchant", on_delete=models.CASCADE, related_name="returns"
    )
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="returns"
    )
    customer_name = models.CharField(max_length=255)
    type = models.CharField(max_length=16, choices=TYPE_CHOICES, default="REFUND")
    reason = models.CharField(max_length=64)
    note = models.TextField(blank=True, default="")
    refund_method = models.CharField(max_length=32, choices=REFUND_METHOD_CHOICES, default="original")
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    exchange_variant = models.ForeignKey(
        "catalog.ProductVariant", on_delete=models.SET_NULL, null=True, blank=True, related_name="exchange_returns"
    )
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
    driver_name = models.CharField(max_length=128, blank=True, default="")
    driver_phone = models.CharField(max_length=32, blank=True, default="")
    estimated_arrival_window = models.CharField(max_length=64, blank=True, default="")
    proof_image_url = models.TextField(blank=True, default="", help_text="Unboxing photo / return proof image URL")
    proof_verified = models.BooleanField(default=False)
    reviewed_by = models.CharField(max_length=255, blank=True, default="")
    reviewed_at = models.DateTimeField(null=True, blank=True)

    # ── Shopper-Submitted Verification (at return request time) ──
    # CP17b: Serial/IMEI the shopper claims to be returning
    shopper_serial_number = models.CharField(max_length=128, blank=True, default="")
    shopper_imei_number = models.CharField(max_length=64, blank=True, default="")
    # CP19: Shopper's self-reported condition
    shopper_reported_condition = models.CharField(
        max_length=32, choices=CONDITION_CHOICES, default="unknown"
    )

    # ── Agent / Warehouse Verification (at product receipt) ──────
    # CP17b: Actual serial/IMEI found on returned product
    returned_serial_number = models.CharField(max_length=128, blank=True, default="")
    returned_imei_number = models.CharField(max_length=64, blank=True, default="")
    # CP17b: Mismatch flags
    serial_mismatch = models.BooleanField(default=False)
    imei_mismatch = models.BooleanField(default=False)
    # CP19: Verified product condition
    product_condition = models.CharField(
        max_length=32, choices=CONDITION_CHOICES, default="unknown"
    )
    # CP20: Packaging condition
    packaging_condition = models.CharField(
        max_length=32, choices=PACKAGING_CHOICES, default="not_inspected"
    )
    # CP18: Accessories tracking
    accessories_expected = models.JSONField(default=list, help_text="List of accessories that were shipped")
    accessories_returned = models.JSONField(default=list, help_text="List of accessories actually returned")
    accessories_missing = models.JSONField(default=list, help_text="List of missing accessories")
    # CP22: Quantity verification
    quantity_claimed = models.PositiveIntegerField(default=1)
    quantity_received = models.PositiveIntegerField(null=True, blank=True)
    # CP21: Product swap detection
    is_product_swap_detected = models.BooleanField(default=False)
    swap_details = models.TextField(blank=True, default="")
    # CP11: Reason change tracking
    original_reason = models.CharField(max_length=64, blank=True, default="")
    reason_changed = models.BooleanField(default=False)
    reason_change_history = models.JSONField(default=list, help_text="History of reason changes")
    # Agent verification metadata
    verified_by = models.CharField(max_length=255, blank=True, default="")
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_notes = models.TextField(blank=True, default="")
    verification_images = models.JSONField(default=list, help_text="Photos taken during verification")
    # Per-checkpoint signal breakdown stored on the return
    checkpoint_signals = models.JSONField(default=list, help_text="Detailed per-checkpoint scoring breakdown")

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
