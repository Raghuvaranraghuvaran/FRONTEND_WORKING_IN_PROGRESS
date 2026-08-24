import uuid
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from accounts.models import User, ShopperProfile, Address
from merchants.models import Merchant, MerchantProfile
from fraud.models import FraudConfiguration, RiskScoreEvent
from catalog.models import Category, Product
from orders.models import Order, OrderItem
from returns.models import ReturnRequest, ReturnLine, ReturnEvent
from audit.models import AuditLog
from admin_api.models import DeliveryAgent, SelfTuningSuggestion


class Command(BaseCommand):
    help = "Seed comprehensive demo data for merchant and shoppers."

    @transaction.atomic
    def handle(self, *args, **options):
        # 1. Merchant Tenant
        merchant, _ = Merchant.objects.get_or_create(
            store_slug="aria-fashion-house",
            defaults={
                "business_name": "Aria Fashion House",
                "admin_email": "demo@merchant.com",
                "merchant_username": "ARIAFASHION4827",
                "plan_tier": "Pilot",
            },
        )
        if merchant.merchant_username != "ARIAFASHION4827":
            merchant.merchant_username = "ARIAFASHION4827"
            merchant.save(update_fields=["merchant_username"])

        # 2. Merchant Admin Users
        demo_user, _ = User.objects.get_or_create(
            email="demo@merchant.com",
            defaults={"name": "Demo Merchant", "role": User.ROLE_MERCHANT_ADMIN, "merchant_username": "ARIAFASHION4827"},
        )
        demo_user.set_password("demo123")
        demo_user.merchant_username = "ARIAFASHION4827"
        demo_user.role = User.ROLE_MERCHANT_ADMIN
        demo_user.save()
        MerchantProfile.objects.get_or_create(user=demo_user, defaults={"merchant": merchant})

        admin_user, _ = User.objects.get_or_create(
            email="admin@returnguard.in",
            defaults={"name": "Aria Admin", "role": User.ROLE_MERCHANT_ADMIN},
        )
        admin_user.set_password("demo123")
        admin_user.role = User.ROLE_MERCHANT_ADMIN
        admin_user.save()
        MerchantProfile.objects.get_or_create(user=admin_user, defaults={"merchant": merchant})

        # 3. Fraud Configuration
        fraud_config, _ = FraudConfiguration.objects.get_or_create(
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

        # 4. Categories
        categories_data = [
            ("cat_ethnic", "Ethnic Wear", "Kurtas, sarees, lehengas and festive wear"),
            ("cat_daily", "Daily Wear", "Everyday tops, shirts and basics"),
            ("cat_electronics", "Electronics", "Gadgets and accessories"),
            ("cat_home", "Home", "Home and living essentials"),
        ]
        cat_map = {}
        for cid, cname, cdesc in categories_data:
            cat, _ = Category.objects.get_or_create(
                id=cid,
                merchant=merchant,
                defaults={"name": cname, "description": cdesc, "slug": cid},
            )
            cat_map[cid] = cat

        # 5. Products
        products_data = [
            ("prod_1", "cat_ethnic", "Embroidered Lehenga Set", Decimal("6499.00"), 12, "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80", "Festive three-piece lehenga set with mirror work."),
            ("prod_2", "cat_ethnic", "Silk Banarasi Saree", Decimal("8999.00"), 8, "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80", "Handwoven Banarasi silk saree for weddings."),
            ("prod_3", "cat_ethnic", "Designer Kurta Set", Decimal("2499.00"), 20, "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=600&q=80", "Comfortable festive kurta with matching bottoms."),
            ("prod_4", "cat_daily", "Cotton Shirt", Decimal("1299.00"), 40, "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80", "Breathable everyday cotton shirt."),
            ("prod_5", "cat_daily", "Relaxed Fit T-Shirt", Decimal("799.00"), 60, "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80", "Soft relaxed-fit tee for daily wear."),
            ("prod_6", "cat_daily", "Linen Trouser", Decimal("1999.00"), 25, "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=80", "Tailored linen trousers for work or casual looks."),
            ("prod_7", "cat_electronics", "Wireless Earbuds", Decimal("3999.00"), 15, "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=600&q=80", "Compact earbuds with active noise cancellation."),
            ("prod_8", "cat_electronics", "Smart Fitness Band", Decimal("2799.00"), 30, "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=600&q=80", "Tracks activity, sleep and heart rate."),
            ("prod_9", "cat_home", "Ceramic Dinner Set", Decimal("3499.00"), 18, "https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=600&q=80", "Twelve-piece ceramic dinnerware set."),
            ("prod_10", "cat_home", "Decorative Table Lamp", Decimal("1899.00"), 22, "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80", "Warm ambient lamp for living spaces."),
            ("prod_11", "cat_ethnic", "Chanderi Anarkali Dress", Decimal("3299.00"), 14, "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80", "Lightweight Chanderi Anarkali with delicate gold detailing."),
            ("prod_12", "cat_ethnic", "Printed Cotton Dupatta", Decimal("899.00"), 28, "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80", "Hand-block inspired cotton dupatta for everyday festive styling."),
            ("prod_13", "cat_daily", "Oversized Linen Shirt", Decimal("1799.00"), 24, "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80", "Relaxed linen shirt designed for warm-weather comfort."),
            ("prod_14", "cat_daily", "Everyday Canvas Sneakers", Decimal("2199.00"), 32, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80", "Cushioned low-top sneakers for daily commutes and weekends."),
            ("prod_15", "cat_electronics", "Portable Bluetooth Speaker", Decimal("2499.00"), 19, "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80", "Compact wireless speaker with rich sound for indoor and outdoor use."),
            ("prod_16", "cat_electronics", "Fast Charge Power Bank", Decimal("1599.00"), 26, "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80", "High-capacity power bank with USB-C fast charging."),
            ("prod_17", "cat_home", "Woven Storage Basket", Decimal("1299.00"), 21, "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=600&q=80", "Textured woven basket for throws, toys, and everyday storage."),
            ("prod_18", "cat_home", "Cotton Cushion Cover Set", Decimal("749.00"), 35, "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80", "Set of two soft cotton cushion covers with modern patterns."),
        ]
        prod_map = {}
        for pid, cid, pname, pprice, pstock, pimg, pdesc in products_data:
            prod, _ = Product.objects.get_or_create(
                id=pid,
                merchant=merchant,
                defaults={
                    "category": cat_map.get(cid),
                    "name": pname,
                    "price": pprice,
                    "stock": pstock,
                    "image": pimg,
                    "description": pdesc,
                    "is_active": True,
                },
            )
            prod_map[pid] = prod

        # 6. Shoppers
        shoppers_data = [
            ("meera@example.com", "Meera Iyer", "+91 90123 45678", "CUST-1003", "14, Lake View Street, Adyar, Chennai 600020", "Low", 6, 1, 0, 1500),
            ("rohit@example.com", "Rohit Verma", "+91 98765 43210", "CUST-1001", "Flat 402, Palm Heights, Indiranagar, Bengaluru 560038", "High", 12, 7, 3, 400),
            ("ananya@example.com", "Ananya Sen", "+91 98111 22334", "CUST-1002", "12B, Southern Avenue, Kolkata 700029", "Medium", 8, 3, 1, 950),
            ("kavita@example.com", "Kavita Nair", "+91 94444 55667", "CUST-1004", "704, Sea Breeze Apts, Bandra West, Mumbai 400050", "Low", 4, 0, 0, 1200),
            ("demo@shopper.com", "Demo Shopper", "+91 99999 00000", "CUST-DEMO", "Demo Address, Test Street, Demo City 123456", "Low", 5, 1, 0, 1000),
            ("raghuvaranraghuvaran65@gmail.com", "Raghuvaran Bellamkonda", "+91 97012 34567", "CUST-1005", "Flat 301, Silicon Valley Residences, Hitec City, Hyderabad 500081", "Low", 3, 0, 0, 1800),
        ]

        shopper_users = {}
        for semail, sname, sphone, scust_id, saddr, stier, torders, treturns, tcod, rpts in shoppers_data:
            suser, _ = User.objects.get_or_create(
                email=semail,
                defaults={"name": sname, "phone": sphone, "role": User.ROLE_SHOPPER},
            )
            suser.set_password("demo123")
            suser.name = sname
            suser.phone = sphone
            suser.save()
            shopper_users[semail] = suser

            sprof, _ = ShopperProfile.objects.get_or_create(
                user=suser,
                defaults={
                    "merchant": merchant,
                    "customer_id": scust_id,
                    "risk_tier": stier,
                    "total_orders": torders,
                    "total_returns": treturns,
                    "total_cod_refusals": tcod,
                    "reward_points": rpts,
                    "gender": "Male" if "Rohit" in sname or "Raghu" in sname or "Demo" in sname else "Female",
                },
            )
            if saddr:
                Address.objects.get_or_create(
                    shopper=sprof,
                    line=saddr,
                    defaults={"label": "Home", "is_primary": True},
                )

        # 7. Sample Orders
        sample_orders_data = [
            ("ORD-1025", "rohit@example.com", Decimal("6499.00"), "COD", "Review", "Pending Review", "High", [("prod_1", 1, Decimal("6499.00"))]),
            ("ORD-1024", "ananya@example.com", Decimal("2499.00"), "UPI", "Confirmed", "In Transit", "Medium", [("prod_3", 1, Decimal("2499.00"))]),
            ("ORD-1023", "meera@example.com", Decimal("8999.00"), "CREDIT_CARD", "Confirmed", "Delivered", "Low", [("prod_2", 1, Decimal("8999.00"))]),
            ("ORD-1022", "kavita@example.com", Decimal("3999.00"), "UPI", "Confirmed", "Delivered", "Low", [("prod_7", 1, Decimal("3999.00"))]),
            ("ORD-1021", "demo@shopper.com", Decimal("3299.00"), "CREDIT_CARD", "Confirmed", "Delivered", "Low", [("prod_11", 1, Decimal("3299.00"))]),
            ("ORD-1020", "rohit@example.com", Decimal("5498.00"), "COD", "Confirmed", "Delivered", "High", [("prod_8", 2, Decimal("2749.00"))]),
            ("ORD-1019", "raghuvaranraghuvaran65@gmail.com", Decimal("4098.00"), "UPI", "Confirmed", "Delivered", "Low", [("prod_14", 1, Decimal("2199.00")), ("prod_10", 1, Decimal("1899.00"))]),
            ("ORD-1018", "ananya@example.com", Decimal("3499.00"), "CREDIT_CARD", "Confirmed", "Delivered", "Medium", [("prod_9", 1, Decimal("3499.00"))]),
            ("ORD-1017", "meera@example.com", Decimal("1299.00"), "UPI", "Confirmed", "Delivered", "Low", [("prod_4", 1, Decimal("1299.00"))]),
            ("ORD-1016", "rohit@example.com", Decimal("2499.00"), "COD", "Confirmed", "Delivered", "High", [("prod_15", 1, Decimal("2499.00"))]),
        ]

        created_orders = {}
        for onum, oemail, ototal, opay, ostatus, odelivery, orisk, oitems in sample_orders_data:
            ouser = shopper_users.get(oemail)
            if not ouser:
                continue
            order, created = Order.objects.get_or_create(
                order_number=onum,
                defaults={
                    "merchant": merchant,
                    "user": ouser,
                    "customer_name": ouser.name,
                    "subtotal": ototal,
                    "discount": Decimal("0.00"),
                    "total": ototal,
                    "payment_method": opay,
                    "status": ostatus,
                    "delivery_status": odelivery,
                    "risk_tier": orisk,
                    "verification_status": "Verified" if orisk == "Low" else "Manual Review Required" if orisk == "High" else "Verified",
                    "delivery_address": ouser.shopper_profile.addresses.first().line if hasattr(ouser, 'shopper_profile') and ouser.shopper_profile.addresses.exists() else "Demo Delivery Address",
                    "tracking_events": [
                        {"status": "Order Placed", "timestamp": (timezone.now() - timedelta(days=4)).isoformat(), "location": "System"},
                        {"status": "Packed & Verified", "timestamp": (timezone.now() - timedelta(days=3)).isoformat(), "location": "Warehouse Mumbai"},
                        {"status": odelivery, "timestamp": timezone.now().isoformat(), "location": "Hub Central"},
                    ],
                },
            )
            created_orders[onum] = order
            if created or order.items.count() == 0:
                for pid, qty, price in oitems:
                    OrderItem.objects.create(
                        order=order,
                        product=prod_map.get(pid),
                        name=prod_map.get(pid).name if prod_map.get(pid) else "Fashion Item",
                        quantity=qty,
                        price=price,
                    )

        # 8. Sample Return Requests (Flagged & Approved)
        sample_returns_data = [
            ("ORD-1025", "rohit@example.com", "Changed Mind", "Returned after wear tag detached.", "High", 78, "manual_review", "pending_review", [("prod_1", 1, Decimal("6499.00"))]),
            ("ORD-1020", "rohit@example.com", "Defective Item", "Customer reported battery draining quickly.", "High", 72, "manual_review", "pending_review", [("prod_8", 1, Decimal("2749.00"))]),
            ("ORD-1018", "ananya@example.com", "Size Issue", "Requested size exchange from M to L.", "Medium", 42, "approved", "legitimate_return", [("prod_9", 1, Decimal("3499.00"))]),
            ("ORD-1023", "meera@example.com", "Color Difference", "Slight color shade difference from catalog photo.", "Low", 18, "approved", "legitimate_return", [("prod_2", 1, Decimal("8999.00"))]),
            ("ORD-1016", "rohit@example.com", "Suspected Fraud", "Device mismatch with previous COD refusal history.", "High", 85, "manual_review", "pending_review", [("prod_15", 1, Decimal("2499.00"))]),
        ]

        for onum, remail, rreason, rnote, rtier, rscore, rstatus, routcome, rlines in sample_returns_data:
            rorder = created_orders.get(onum)
            ruser = shopper_users.get(remail)
            if not rorder or not ruser:
                continue
            ret_req, created = ReturnRequest.objects.get_or_create(
                order=rorder,
                defaults={
                    "merchant": merchant,
                    "user": ruser,
                    "customer_name": ruser.name,
                    "reason": rreason,
                    "note": rnote,
                    "risk_tier": rtier,
                    "risk_score": rscore,
                    "status": rstatus,
                    "outcome": routcome,
                    "verification_status": "Flagged" if rtier == "High" else "Verified",
                    "verification_method": "ai_scoring",
                    "signals": ["High return frequency", "COD refusal correlation"] if rtier == "High" else ["Standard return policy"],
                    "reviewed_by": "demo@merchant.com" if rstatus == "approved" else "",
                    "reviewed_at": timezone.now() if rstatus == "approved" else None,
                },
            )
            if created or ret_req.return_lines.count() == 0:
                for pid, qty, price in rlines:
                    ReturnLine.objects.create(
                        return_request=ret_req,
                        product=prod_map.get(pid),
                        name=prod_map.get(pid).name if prod_map.get(pid) else "Product Line",
                        quantity=qty,
                        price=price,
                    )
                ReturnEvent.objects.create(return_request=ret_req, label=f"Return Requested ({rreason})")
                if rstatus == "approved":
                    ReturnEvent.objects.create(return_request=ret_req, label="Return Approved by Merchant")

        # 9. Delivery Agents
        agents_data = [
            ("Suresh Kumar", "Bengaluru Central", "560038", 148, 22, 14.9, 15.2, 2, "Monitor"),
            ("Imran Khan", "Mumbai West", "400058", 96, 21, 21.9, 12.4, 6, "High Risk"),
            ("Pooja Nair", "Chennai South", "600020", 112, 12, 10.7, 11.5, 1, "Normal"),
            ("Amitabh Das", "Kolkata East", "700029", 84, 15, 17.8, 14.0, 3, "Monitor"),
        ]
        for aname, aroute, apincode, atotal, aret, arate, aexprate, aflag, arisk in agents_data:
            DeliveryAgent.objects.get_or_create(
                merchant=merchant,
                name=aname,
                defaults={
                    "route": aroute,
                    "pincode": apincode,
                    "total_deliveries": atotal,
                    "total_returns_handled": aret,
                    "return_rate": arate,
                    "expected_return_rate": aexprate,
                    "flagged_return_count": aflag,
                    "risk_flag": arisk,
                },
            )

        # 10. Self-Tuning Suggestions
        suggestions_data = [
            ("cod_refusal", "COD Refusal Penalty Weight", 0.18, 0.24, "Recent COD refusals in Mumbai cluster show 34% correlation with subsequent return fraud.", 0.88, 142, 14),
            ("return_frequency", "Return Frequency Threshold", 0.32, 0.28, "Festive season baseline allows slightly higher return tolerance for ethnic category.", 0.91, 280, 21),
            ("address_mismatch", "Address Mismatch Signal Weight", 0.12, 0.16, "Repeated shipping to alternate PIN codes with high return rates observed.", 0.84, 98, 7),
        ]
        for srule, slabel, scurr, ssugg, sreason, sconf, ssamp, swin in suggestions_data:
            SelfTuningSuggestion.objects.get_or_create(
                merchant=merchant,
                rule=srule,
                defaults={
                    "label": slabel,
                    "current_value": scurr,
                    "suggested_value": ssugg,
                    "reason": sreason,
                    "confidence": sconf,
                    "sample_size": ssamp,
                    "window_days": swin,
                    "status": "suggested",
                },
            )

        # 11. Audit Logs
        audit_data = [
            ("demo@merchant.com", "updated", "Fraud rule configuration", "Adjusted return frequency weight from 0.30 to 0.32."),
            ("demo@merchant.com", "approved", "Return ORD-1018", "Customer provided size mismatch proof, approved for store exchange."),
            ("demo@merchant.com", "created", "Product: Titan Smart Watch", "Added new premium wearable to Electronics."),
            ("demo@merchant.com", "flagged", "Order ORD-1025", "Composite risk score 78 exceeded manual review threshold."),
            ("demo@merchant.com", "bulk_imported", "Products Bulk Entry", "Imported 18 default seasonal catalog items."),
            ("demo@merchant.com", "login", "Merchant Portal Session", "Merchant admin logged in successfully from Bengaluru HQ."),
        ]
        for actor, action, target, notes in audit_data:
            AuditLog.objects.get_or_create(
                merchant=merchant,
                target=target,
                action=action,
                defaults={"actor": actor, "notes": notes},
            )

        self.stdout.write(self.style.SUCCESS("All comprehensive demo data for merchant & shoppers seeded successfully."))
