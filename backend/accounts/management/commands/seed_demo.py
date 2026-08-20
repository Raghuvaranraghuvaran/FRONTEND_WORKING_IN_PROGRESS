from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import User
from merchants.models import Merchant, MerchantProfile
from fraud.models import FraudConfiguration


class Command(BaseCommand):
    help = "Create the initial merchant tenant and merchant admin account."

    @transaction.atomic
    def handle(self, *args, **options):
        merchant, _ = Merchant.objects.get_or_create(
            store_slug="aria-fashion-house",
            defaults={
                "business_name": "Aria Fashion House",
                "admin_email": "admin@returnguard.in",
                "plan_tier": "Pilot",
            },
        )

        admin_email = "admin@returnguard.in"
        admin, _ = User.objects.get_or_create(
            email=admin_email,
            defaults={"name": "Aria Admin", "role": User.ROLE_MERCHANT_ADMIN},
        )
        admin.set_password("password")
        admin.save()
        MerchantProfile.objects.get_or_create(user=admin, merchant=merchant)

        FraudConfiguration.objects.get_or_create(
            merchant=merchant,
            defaults={
                "weights": {
                    "return_frequency": 0.32,
                    "cod_refusal": 0.18,
                    "device_reuse": 0.22,
                    "address_mismatch": 0.12,
                    "seasonal_signal": 0.16,
                },
                "thresholds": {"low_max": 34, "medium_max": 64, "high_min": 65},
            },
        )

        from accounts.models import Address, ShopperProfile

        shoppers_data = [
            {
                "email": "meera@example.com",
                "name": "Meera Iyer",
                "phone": "+91 90123 45678",
                "customer_id": "CUST-1003",
                "address": "14, Lake View Street, Adyar, Chennai 600020",
                "risk_tier": "Low",
                "total_orders": 6,
                "total_returns": 1,
            },
            {
                "email": "rohit@example.com",
                "name": "Rohit Verma",
                "phone": "+91 98765 43210",
                "customer_id": "CUST-1001",
                "address": "Flat 402, Palm Heights, Indiranagar, Bengaluru 560038",
                "risk_tier": "High",
                "total_orders": 12,
                "total_returns": 7,
            },
            {
                "email": "ananya@example.com",
                "name": "Ananya Sen",
                "phone": "+91 98111 22334",
                "customer_id": "CUST-1002",
                "address": "12B, Southern Avenue, Kolkata 700029",
                "risk_tier": "Medium",
                "total_orders": 8,
                "total_returns": 3,
            },
            {
                "email": "kavita@example.com",
                "name": "Kavita Nair",
                "phone": "+91 94444 55667",
                "customer_id": "CUST-1004",
                "address": "704, Sea Breeze Apts, Bandra West, Mumbai 400050",
                "risk_tier": "Low",
                "total_orders": 4,
                "total_returns": 0,
            },
        ]

        for s in shoppers_data:
            shopper_user, created = User.objects.get_or_create(
                email=s["email"],
                defaults={"name": s["name"], "phone": s["phone"], "role": User.ROLE_SHOPPER},
            )
            shopper_user.set_password("password")
            shopper_user.name = s["name"]
            shopper_user.phone = s["phone"]
            shopper_user.save()

            profile, _ = ShopperProfile.objects.get_or_create(
                user=shopper_user,
                defaults={
                    "merchant": merchant,
                    "customer_id": s["customer_id"],
                    "risk_tier": s["risk_tier"],
                    "total_orders": s["total_orders"],
                    "total_returns": s["total_returns"],
                },
            )
            if s.get("address"):
                Address.objects.get_or_create(
                    shopper=profile,
                    line=s["address"],
                    defaults={"label": "Home", "is_primary": True},
                )

        from catalog.models import Category, Product

        categories_data = [
            {"id": "cat_ethnic", "name": "Ethnic Wear", "description": "Kurtas, sarees, lehengas and festive wear"},
            {"id": "cat_daily", "name": "Daily Wear", "description": "Everyday tops, shirts and basics"},
            {"id": "cat_electronics", "name": "Electronics", "description": "Gadgets and accessories"},
            {"id": "cat_home", "name": "Home", "description": "Home and living essentials"},
        ]

        cat_objs = {}
        for c in categories_data:
            cat, _ = Category.objects.get_or_create(
                id=c["id"],
                merchant=merchant,
                defaults={"name": c["name"], "description": c["description"], "slug": c["id"]},
            )
            cat_objs[c["id"]] = cat

        products_data = [
            {"id": "prod_1", "cat": "cat_ethnic", "name": "Embroidered Lehenga Set", "price": "6499.00", "stock": 12, "image": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80", "description": "Festive three-piece lehenga set with mirror work."},
            {"id": "prod_2", "cat": "cat_ethnic", "name": "Silk Banarasi Saree", "price": "8999.00", "stock": 8, "image": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80", "description": "Handwoven Banarasi silk saree for weddings."},
            {"id": "prod_3", "cat": "cat_ethnic", "name": "Designer Kurta Set", "price": "2499.00", "stock": 20, "image": "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=600&q=80", "description": "Comfortable festive kurta with matching bottoms."},
            {"id": "prod_4", "cat": "cat_daily", "name": "Cotton Shirt", "price": "1299.00", "stock": 40, "image": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80", "description": "Breathable everyday cotton shirt."},
            {"id": "prod_5", "cat": "cat_daily", "name": "Relaxed Fit T-Shirt", "price": "799.00", "stock": 60, "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80", "description": "Soft relaxed-fit tee for daily wear."},
            {"id": "prod_6", "cat": "cat_daily", "name": "Linen Trouser", "price": "1999.00", "stock": 25, "image": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=80", "description": "Tailored linen trousers for work or casual looks."},
            {"id": "prod_7", "cat": "cat_electronics", "name": "Wireless Earbuds", "price": "3999.00", "stock": 15, "image": "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=600&q=80", "description": "Compact earbuds with active noise cancellation."},
            {"id": "prod_8", "cat": "cat_electronics", "name": "Smart Fitness Band", "price": "2799.00", "stock": 30, "image": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=600&q=80", "description": "Tracks activity, sleep and heart rate."},
            {"id": "prod_9", "cat": "cat_home", "name": "Ceramic Dinner Set", "price": "3499.00", "stock": 18, "image": "https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=600&q=80", "description": "Twelve-piece ceramic dinnerware set."},
            {"id": "prod_10", "cat": "cat_home", "name": "Decorative Table Lamp", "price": "1899.00", "stock": 22, "image": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80", "description": "Warm ambient lamp for living spaces."},
            {"id": "prod_11", "cat": "cat_ethnic", "name": "Chanderi Anarkali Dress", "price": "3299.00", "stock": 14, "image": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80", "description": "Lightweight Chanderi Anarkali with delicate gold detailing."},
            {"id": "prod_12", "cat": "cat_ethnic", "name": "Printed Cotton Dupatta", "price": "899.00", "stock": 28, "image": "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80", "description": "Hand-block inspired cotton dupatta for everyday festive styling."},
            {"id": "prod_13", "cat": "cat_daily", "name": "Oversized Linen Shirt", "price": "1799.00", "stock": 24, "image": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80", "description": "Relaxed linen shirt designed for warm-weather comfort."},
            {"id": "prod_14", "cat": "cat_daily", "name": "Everyday Canvas Sneakers", "price": "2199.00", "stock": 32, "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80", "description": "Cushioned low-top sneakers for daily commutes and weekends."},
            {"id": "prod_15", "cat": "cat_electronics", "name": "Portable Bluetooth Speaker", "price": "2499.00", "stock": 19, "image": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80", "description": "Compact wireless speaker with rich sound for indoor and outdoor use."},
            {"id": "prod_16", "cat": "cat_electronics", "name": "Fast Charge Power Bank", "price": "1599.00", "stock": 26, "image": "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80", "description": "High-capacity power bank with USB-C fast charging."},
            {"id": "prod_17", "cat": "cat_home", "name": "Woven Storage Basket", "price": "1299.00", "stock": 21, "image": "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=600&q=80", "description": "Textured woven basket for throws, toys, and everyday storage."},
            {"id": "prod_18", "cat": "cat_home", "name": "Cotton Cushion Cover Set", "price": "749.00", "stock": 35, "image": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80", "description": "Set of two soft cotton cushion covers with modern patterns."},
        ]

        for p in products_data:
            Product.objects.get_or_create(
                id=p["id"],
                merchant=merchant,
                defaults={
                    "category": cat_objs.get(p["cat"]),
                    "name": p["name"],
                    "price": p["price"],
                    "stock": p["stock"],
                    "image": p["image"],
                    "description": p["description"],
                    "is_active": True,
                },
            )

        self.stdout.write(self.style.SUCCESS("Initial tenant, admin, demo shoppers, categories, and products created successfully."))


