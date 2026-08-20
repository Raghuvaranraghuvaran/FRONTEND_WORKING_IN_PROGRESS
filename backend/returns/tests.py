from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import ShopperProfile
from catalog.models import Category, Product
from merchants.models import Merchant
from orders.models import Order, OrderItem

User = get_user_model()


class ReturnApiTests(TestCase):
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
        self.order = Order.objects.create(
            order_number="#1028",
            merchant=self.merchant,
            user=self.user,
            customer_name="Shopper",
            total=1000,
            payment_method="COD",
        )
        OrderItem.objects.create(
            order=self.order, product=self.product, name="Test Product", quantity=1, price=1000
        )
        self.client.force_authenticate(self.user)

    def test_create_return(self):
        response = self.client.post(
            "/api/returns/",
            {"order_id": self.order.id, "reason": "wrong_size", "pickup_slot": "tomorrow_morning"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn("risk_score", response.data["data"])

    def test_return_other_users_order_rejected(self):
        other = User.objects.create_user(
            email="other@test.in", password="supersecret", name="Other"
        )
        ShopperProfile.objects.create(user=other, merchant=self.merchant)
        self.client.force_authenticate(other)
        response = self.client.post(
            "/api/returns/",
            {"order_id": self.order.id, "reason": "wrong_size", "pickup_slot": "tomorrow_morning"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"]["code"], "RETURN_NOT_ELIGIBLE")
