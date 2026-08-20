from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import ShopperProfile
from merchants.models import Merchant, MerchantProfile

User = get_user_model()


class TenantIsolationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.merchant_a = Merchant.objects.create(
            business_name="House A", store_slug="house-a", admin_email="admin@a.in"
        )
        self.merchant_b = Merchant.objects.create(
            business_name="House B", store_slug="house-b", admin_email="admin@b.in"
        )

        self.admin_a = User.objects.create_user(
            email="admin@a.in", password="supersecret", name="Admin A", role="merchant_admin"
        )
        MerchantProfile.objects.create(user=self.admin_a, merchant=self.merchant_a)

        self.admin_b = User.objects.create_user(
            email="admin@b.in", password="supersecret", name="Admin B", role="merchant_admin"
        )
        MerchantProfile.objects.create(user=self.admin_b, merchant=self.merchant_b)

        # A shopper belongs to merchant A.
        self.shopper_a = User.objects.create_user(
            email="shopper@a.in", password="supersecret", name="Shopper A"
        )
        ShopperProfile.objects.create(user=self.shopper_a, merchant=self.merchant_a)

    def test_admin_does_not_see_other_merchant_data(self):
        self.client.force_authenticate(self.admin_a)
        response = self.client.get("/api/admin/customers/")
        self.assertEqual(response.status_code, 200)
        emails = [c["email"] for c in response.data["data"]]
        self.assertIn("shopper@a.in", emails)

        self.client.force_authenticate(self.admin_b)
        response_b = self.client.get("/api/admin/customers/")
        emails_b = [c["email"] for c in response_b.data["data"]]
        self.assertNotIn("shopper@a.in", emails_b)
