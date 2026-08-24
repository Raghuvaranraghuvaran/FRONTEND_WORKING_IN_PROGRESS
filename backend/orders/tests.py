from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import Address, ShopperProfile
from catalog.models import Category, Product
from merchants.models import Merchant

User = get_user_model()


class CheckoutApiTests(TestCase):
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
        self.profile = ShopperProfile.objects.create(
            user=self.user, merchant=self.merchant, customer_id="CUST-1"
        )
        self.category = Category.objects.create(
            id="cat_test", merchant=self.merchant, name="Test", slug="cat_test"
        )
        self.product = Product.objects.create(
            id="prod_test",
            merchant=self.merchant,
            category=self.category,
            name="Test Product",
            price=1000,
            stock=10,
        )
        self.client.force_authenticate(self.user)

    def test_checkout_creates_order(self):
        response = self.client.post(
            "/api/orders/checkout/",
            {
                "items": [{"product_id": "prod_test", "quantity": 2}],
                "payment_method": "COD",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        order_data = response.data["data"]["order"]
        self.assertTrue(order_data["order_number"].startswith("#"))
        self.assertEqual(float(order_data["total"]), 2000.0)
        self.assertEqual(order_data["reward_points_earned"], 200)

    def test_checkout_empty_items_rejected(self):
        response = self.client.post(
            "/api/orders/checkout/",
            {
                "items": [],
                "payment_method": "COD",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
