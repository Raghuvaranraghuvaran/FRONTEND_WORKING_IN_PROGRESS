from django.test import TestCase
from rest_framework.test import APIClient
from decimal import Decimal
from merchants.models import Merchant
from catalog.models import Category, Product


class AIAssistantTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.merchant = Merchant.objects.create(
            id="merchant_test",
            business_name="Test Store",
            store_slug="test-store",
            admin_email="test@merchant.com",
            phone="+919876543210",
        )
        self.cat_ethnic = Category.objects.create(
            id="cat_ethnic",
            merchant=self.merchant,
            name="Ethnic Wear",
            description="Ethnic collection",
        )
        self.cat_daily = Category.objects.create(
            id="cat_daily",
            merchant=self.merchant,
            name="Daily Wear",
            description="Daily wear shirts and shoes",
        )
        self.prod_1 = Product.objects.create(
            id="prod_1",
            merchant=self.merchant,
            category=self.cat_ethnic,
            name="Embroidered Lehenga Set",
            description="Festive three-piece lehenga set with mirror work.",
            price=Decimal("6499.00"),
            stock=10,
            image="https://example.com/lehenga.jpg",
            is_active=True,
        )
        self.prod_3 = Product.objects.create(
            id="prod_3",
            merchant=self.merchant,
            category=self.cat_ethnic,
            name="Designer Kurta Set",
            description="Comfortable festive kurta with matching bottoms.",
            price=Decimal("2499.00"),
            stock=15,
            image="https://example.com/kurta.jpg",
            is_active=True,
        )
        self.prod_14 = Product.objects.create(
            id="prod_14",
            merchant=self.merchant,
            category=self.cat_daily,
            name="Everyday Canvas Sneakers",
            description="Cushioned low-top sneakers for daily commutes and weekends.",
            price=Decimal("2199.00"),
            stock=20,
            image="https://example.com/sneakers.jpg",
            is_active=True,
        )

    def test_welcome_greeting(self):
        res = self.client.post("/api/products/ai-assistant/", {"message": "Hi"}, format="json")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["state"], "welcome")
        self.assertIn("ReturnGuard Shopping Assistant", data["message"])
        self.assertTrue(len(data["quick_options"]) > 0)

    def test_budget_and_category_search(self):
        res = self.client.post(
            "/api/products/ai-assistant/",
            {"message": "I need ethnic wear under 3000"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["state"], "recommendations")
        self.assertTrue(len(data["products"]) > 0)
        # Should recommend Designer Kurta Set (2499) rather than Lehenga (6499)
        top_prod = data["products"][0]
        self.assertEqual(top_prod["id"], "prod_3")
        self.assertTrue(top_prod["price"] <= 3000)

    def test_specific_item_search(self):
        res = self.client.post(
            "/api/products/ai-assistant/",
            {"message": "Show me canvas sneakers for college"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(len(data["products"]) > 0)
        self.assertEqual(data["products"][0]["id"], "prod_14")

    def test_comparison_intent(self):
        res = self.client.post(
            "/api/products/ai-assistant/",
            {
                "message": "Which one is better?",
                "context": {"last_shown_product_ids": ["prod_3", "prod_14"]},
            },
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["state"], "comparison")
        self.assertIn("comparison", data)
        self.assertEqual(len(data["comparison"]["products"]), 2)
