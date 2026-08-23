from django.db import models

from common.models import TimestampedModel


class Order(TimestampedModel):
    STATUS_CHOICES = (
        ("Pending", "Pending"),
        ("Active", "Active"),
        ("Review", "Review"),
        ("Confirmed", "Confirmed"),
    )
    DELIVERY_CHOICES = (
        ("Processing", "Processing"),
        ("Pending Review", "Pending Review"),
        ("In Transit", "In Transit"),
        ("Delivered", "Delivered"),
        ("Cancelled", "Cancelled"),
    )
    PAYMENT_METHOD_CHOICES = (
        ("COD", "Cash on Delivery"),
        ("UPI", "UPI"),
        ("CREDIT_CARD", "Credit Card"),
        ("DEBIT_CARD", "Debit Card"),
        ("NET_BANKING", "Net Banking"),
        ("MOBILE_BANKING", "Mobile Banking"),
        ("Prepaid", "Prepaid"),  # Legacy support
    )

    order_number = models.CharField(max_length=32, unique=True)
    merchant = models.ForeignKey(
        "merchants.Merchant", on_delete=models.CASCADE, related_name="orders"
    )
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="orders"
    )
    customer_name = models.CharField(max_length=255)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=16, choices=PAYMENT_METHOD_CHOICES, default="COD")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="Pending")
    delivery_status = models.CharField(max_length=32, choices=DELIVERY_CHOICES, default="Processing")
    risk_tier = models.CharField(max_length=16, default="Low")
    verification_status = models.CharField(max_length=16, default="Verified")
    verification_method = models.CharField(max_length=16, default="device_only")
    device_token = models.CharField(max_length=128, blank=True, default="")
    delivery_address = models.TextField(blank=True, default="")
    risk_context = models.TextField(blank=True, default="")
    tracking_events = models.JSONField(default=list)

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "catalog.Product", on_delete=models.SET_NULL, null=True, related_name="order_items"
    )
    name = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.name} x{self.quantity}"
