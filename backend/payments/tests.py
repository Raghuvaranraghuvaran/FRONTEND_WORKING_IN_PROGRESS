from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import ShopperProfile
from merchants.models import Merchant
from orders.models import Order
from .gateway import MockPaymentGateway
from .models import Payment

User = get_user_model()


class PaymentWebhookTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.merchant = Merchant.objects.create(
            business_name="Test House",
            store_slug="test-house",
            admin_email="admin@test.in",
        )
        self.user = User.objects.create_user(
            email="shopper@test.in", password="supersecret", name="Shopper"
        )
        ShopperProfile.objects.create(user=self.user, merchant=self.merchant)
        self.order = Order.objects.create(
            order_number="#1028",
            merchant=self.merchant,
            user=self.user,
            customer_name="Shopper",
            total=1000,
            payment_method="Prepaid",
        )
        self.payment = Payment.objects.create(
            order=self.order, merchant=self.merchant, gateway="mock", amount=1000
        )
        self.gateway = MockPaymentGateway()

    def _payload(self, status="paid", **overrides):
        payload = {
            "gateway": "mock",
            "gateway_payment_id": "pay_123",
            "order_id": str(self.order.id),
            "status": status,
            "amount": "1000.00",
            "event_id": "evt_1",
            **overrides,
        }
        payload["signature"] = self.gateway.sign(payload)
        return payload

    def test_valid_webhook_marks_paid(self):
        payload = self._payload()
        response = self.client.post("/api/payments/webhook/", payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "paid")
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "Confirmed")

    def test_invalid_signature_rejected(self):
        payload = self._payload()
        payload["signature"] = "bad-signature"
        response = self.client.post("/api/payments/webhook/", payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"]["code"], "PAYMENT_SIGNATURE_INVALID")
        self.payment.refresh_from_db()
        self.assertNotEqual(self.payment.status, "paid")

    def test_webhook_idempotent(self):
        payload = self._payload()
        first = self.client.post("/api/payments/webhook/", payload, format="json")
        second = self.client.post("/api/payments/webhook/", payload, format="json")
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertFalse(second.data["data"]["processed"])
