from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from merchants.models import Merchant, MerchantProfile

User = get_user_model()


class AuthApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.merchant = Merchant.objects.create(
            business_name="Test House",
            store_slug="test-house",
            admin_email="admin@test.in",
        )

    def test_register_and_login(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "name": "Test Shopper",
                "email": "shopper@test.in",
                "phone": "+91 90000 00000",
                "password": "supersecret",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn("tokens", response.data["data"])
        self.assertEqual(response.data["data"]["user"]["email"], "shopper@test.in")

        login = self.client.post(
            "/api/auth/login/",
            {"email": "shopper@test.in", "password": "supersecret"},
            format="json",
        )
        self.assertEqual(login.status_code, 200)
        self.assertIn("access", login.data["data"]["tokens"])

    def test_register_duplicate_email_rejected(self):
        User.objects.create_user(
            email="dup@test.in", password="supersecret", name="Dup"
        )
        response = self.client.post(
            "/api/auth/register/",
            {
                "name": "Dup",
                "email": "dup@test.in",
                "password": "supersecret",
                "phone": "",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.data)
