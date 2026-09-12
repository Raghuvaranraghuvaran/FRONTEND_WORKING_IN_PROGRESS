import uuid
from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from django.utils.text import slugify

from accounts.models import Address, ShopperProfile, User
from catalog.models import Category, Product
from orders.models import Order, OrderItem
from returns.models import ReturnLine, ReturnRequest


SAMPLE_PRODUCTS_CONFIG = [
    {
        "cat_slug": "cat_ethnic",
        "cat_name": "Ethnic & Festive Wear",
        "cat_desc": "Kurtas, sarees, lehengas, sherwanis, and festive attire",
        "name": "Embroidered Silk Lehenga Set",
        "price": Decimal("6499.00"),
        "original_price": Decimal("8999.00"),
        "stock": 14,
        "image": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80",
        "description": "Festive three-piece lehenga set with intricate zari mirror work and raw silk dupatta.",
        "rating": Decimal("4.8"),
        "review_count": 84,
    },
    {
        "cat_slug": "cat_ethnic",
        "cat_name": "Ethnic & Festive Wear",
        "cat_desc": "Kurtas, sarees, lehengas, sherwanis, and festive attire",
        "name": "Pure Banarasi Silk Saree",
        "price": Decimal("8999.00"),
        "original_price": Decimal("11999.00"),
        "stock": 8,
        "image": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
        "description": "Handwoven Banarasi katan silk saree featuring regal kadhwa golden zari borders.",
        "rating": Decimal("4.9"),
        "review_count": 112,
    },
    {
        "cat_slug": "cat_ethnic",
        "cat_name": "Ethnic & Festive Wear",
        "cat_desc": "Kurtas, sarees, lehengas, sherwanis, and festive attire",
        "name": "Chanderi Anarkali Suit Set",
        "price": Decimal("3499.00"),
        "original_price": Decimal("4999.00"),
        "stock": 18,
        "image": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80",
        "description": "Breathable Chanderi cotton anarkali kurti with delicate thread embroidery and pants.",
        "rating": Decimal("4.6"),
        "review_count": 46,
    },
    {
        "cat_slug": "cat_ethnic",
        "cat_name": "Ethnic & Festive Wear",
        "cat_desc": "Kurtas, sarees, lehengas, sherwanis, and festive attire",
        "name": "Handblock Floral Cotton Kurta",
        "price": Decimal("1899.00"),
        "original_price": Decimal("2499.00"),
        "stock": 25,
        "image": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80",
        "description": "Straight-cut cotton kurta featuring authentic Sanganeri hand-block botanical prints.",
        "rating": Decimal("4.5"),
        "review_count": 39,
    },
    {
        "cat_slug": "cat_daily",
        "cat_name": "Daily & Casual Wear",
        "cat_desc": "T-shirts, shirts, jeans, tops, hoodies, and loungewear",
        "name": "Premium Cotton Oxford Shirt",
        "price": Decimal("1499.00"),
        "original_price": Decimal("2199.00"),
        "stock": 32,
        "image": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80",
        "description": "100% combed cotton Oxford button-down shirt designed for all-day comfort and work.",
        "rating": Decimal("4.7"),
        "review_count": 92,
    },
    {
        "cat_slug": "cat_daily",
        "cat_name": "Daily & Casual Wear",
        "cat_desc": "T-shirts, shirts, jeans, tops, hoodies, and loungewear",
        "name": "Relaxed Fit Heavyweight T-Shirt",
        "price": Decimal("899.00"),
        "original_price": Decimal("1299.00"),
        "stock": 45,
        "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
        "description": "240 GSM drop-shoulder relaxed organic cotton t-shirt in earthy minimalist tones.",
        "rating": Decimal("4.4"),
        "review_count": 58,
    },
    {
        "cat_slug": "cat_daily",
        "cat_name": "Daily & Casual Wear",
        "cat_desc": "T-shirts, shirts, jeans, tops, hoodies, and loungewear",
        "name": "Tailored Linen Casual Trousers",
        "price": Decimal("2299.00"),
        "original_price": Decimal("2999.00"),
        "stock": 3,
        "image": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=80",
        "description": "Breathable European flax linen trousers with elasticated drawstring waistband.",
        "rating": Decimal("4.6"),
        "review_count": 27,
    },
    {
        "cat_slug": "cat_daily",
        "cat_name": "Daily & Casual Wear",
        "cat_desc": "T-shirts, shirts, jeans, tops, hoodies, and loungewear",
        "name": "Classic Urban Canvas Sneakers",
        "price": Decimal("2499.00"),
        "original_price": Decimal("3499.00"),
        "stock": 0,
        "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
        "description": "Vulcanized rubber sole canvas sneakers with anti-odor cushioned memory insoles.",
        "rating": Decimal("4.7"),
        "review_count": 73,
    },
    {
        "cat_slug": "cat_electronics",
        "cat_name": "Electronics & Smart Devices",
        "cat_desc": "Smartphones, audio, smart TVs, tablets, and laptops",
        "name": "Active Noise Cancelling Earbuds Pro",
        "price": Decimal("4499.00"),
        "original_price": Decimal("6999.00"),
        "stock": 16,
        "image": "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=600&q=80",
        "description": "True wireless earbuds with 35dB hybrid active noise cancellation and 32h playback.",
        "rating": Decimal("4.8"),
        "review_count": 134,
    },
    {
        "cat_slug": "cat_electronics",
        "cat_name": "Electronics & Smart Devices",
        "cat_desc": "Smartphones, audio, smart TVs, tablets, and laptops",
        "name": "Smart Fitness Tracker Band 7",
        "price": Decimal("2999.00"),
        "original_price": Decimal("3999.00"),
        "stock": 20,
        "image": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=600&q=80",
        "description": "AMOLED color display fitness smartband with continuous heart-rate and SpO2 tracking.",
        "rating": Decimal("4.5"),
        "review_count": 88,
    },
    {
        "cat_slug": "cat_electronics",
        "cat_name": "Electronics & Smart Devices",
        "cat_desc": "Smartphones, audio, smart TVs, tablets, and laptops",
        "name": "Portable 360° Bluetooth Speaker",
        "price": Decimal("2799.00"),
        "original_price": Decimal("3799.00"),
        "stock": 12,
        "image": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80",
        "description": "IPX7 waterproof portable Bluetooth speaker with deep punchy bass and 16h playtime.",
        "rating": Decimal("4.7"),
        "review_count": 64,
    },
    {
        "cat_slug": "cat_electronics",
        "cat_name": "Electronics & Smart Devices",
        "cat_desc": "Smartphones, audio, smart TVs, tablets, and laptops",
        "name": "65W GaN Fast Dual Charger",
        "price": Decimal("1699.00"),
        "original_price": Decimal("2299.00"),
        "stock": 4,
        "image": "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80",
        "description": "Ultra-compact Gallium Nitride dual port charger for laptops, tablets, and phones.",
        "rating": Decimal("4.9"),
        "review_count": 105,
    },
    {
        "cat_slug": "cat_home",
        "cat_name": "Home, Kitchen & Dining",
        "cat_desc": "Cookware, dinnerware, kitchen appliances, and storage",
        "name": "Ceramic Dinner Set (16-Piece)",
        "price": Decimal("3899.00"),
        "original_price": Decimal("5499.00"),
        "stock": 9,
        "image": "https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=600&q=80",
        "description": "Artisanal glazed stoneware 16-piece dinnerware set, microwave and dishwasher safe.",
        "rating": Decimal("4.6"),
        "review_count": 42,
    },
    {
        "cat_slug": "cat_home",
        "cat_name": "Home, Kitchen & Dining",
        "cat_desc": "Cookware, dinnerware, kitchen appliances, and storage",
        "name": "Modern Amber Glow Table Lamp",
        "price": Decimal("2199.00"),
        "original_price": Decimal("2999.00"),
        "stock": 15,
        "image": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80",
        "description": "Scandinavian minimalist bedside ambient lamp with solid natural oak wood base.",
        "rating": Decimal("4.8"),
        "review_count": 51,
    },
    {
        "cat_slug": "cat_home",
        "cat_name": "Home, Kitchen & Dining",
        "cat_desc": "Cookware, dinnerware, kitchen appliances, and storage",
        "name": "Natural Woven Cotton Storage Basket",
        "price": Decimal("1399.00"),
        "original_price": Decimal("1899.00"),
        "stock": 22,
        "image": "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=600&q=80",
        "description": "Eco-friendly coiled cotton rope organizer basket for laundry, throws, and nurseries.",
        "rating": Decimal("4.5"),
        "review_count": 33,
    },
    {
        "cat_slug": "cat_home",
        "cat_name": "Home, Kitchen & Dining",
        "cat_desc": "Cookware, dinnerware, kitchen appliances, and storage",
        "name": "Boho Jacquard Cushion Covers (Set of 2)",
        "price": Decimal("849.00"),
        "original_price": Decimal("1199.00"),
        "stock": 28,
        "image": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80",
        "description": "Set of two textured geometric woven cotton cushion cases with hidden zipper closures.",
        "rating": Decimal("4.7"),
        "review_count": 67,
    },
]


SAMPLE_CUSTOMERS_CONFIG = [
    {
        "email": "rohit@example.com",
        "name": "Rohit Verma",
        "phone": "+91 98765 43210",
        "address": "Flat 402, Palm Heights, Indiranagar, Bengaluru 560038",
        "risk_tier": "High",
        "total_orders": 12,
        "total_returns": 7,
        "total_cod_refusals": 3,
        "reward_points": 400,
    },
    {
        "email": "ananya@example.com",
        "name": "Ananya Sen",
        "phone": "+91 98111 22334",
        "address": "12B, Southern Avenue, Kolkata 700029",
        "risk_tier": "Medium",
        "total_orders": 8,
        "total_returns": 3,
        "total_cod_refusals": 1,
        "reward_points": 950,
    },
    {
        "email": "meera@example.com",
        "name": "Meera Iyer",
        "phone": "+91 90123 45678",
        "address": "14, Lake View Street, Adyar, Chennai 600020",
        "risk_tier": "Low",
        "total_orders": 6,
        "total_returns": 1,
        "total_cod_refusals": 0,
        "reward_points": 1500,
    },
    {
        "email": "kavita@example.com",
        "name": "Kavita Nair",
        "phone": "+91 94444 55667",
        "address": "704, Sea Breeze Apts, Bandra West, Mumbai 400050",
        "risk_tier": "Low",
        "total_orders": 4,
        "total_returns": 0,
        "total_cod_refusals": 0,
        "reward_points": 1200,
    },
    {
        "email": "raghuvaranraghuvaran65@gmail.com",
        "name": "Raghuvaran Bellamkonda",
        "phone": "+91 97012 34567",
        "address": "Flat 301, Silicon Valley Residences, Hitec City, Hyderabad 500081",
        "risk_tier": "Low",
        "total_orders": 5,
        "total_returns": 0,
        "total_cod_refusals": 0,
        "reward_points": 1800,
    },
    {
        "email": "priya.sharma@example.com",
        "name": "Priya Sharma",
        "phone": "+91 98220 11223",
        "address": "Plot 88, Viman Nagar, Pune 411014",
        "risk_tier": "Low",
        "total_orders": 7,
        "total_returns": 1,
        "total_cod_refusals": 0,
        "reward_points": 1400,
    },
]


def ensure_merchant_sample_data(merchant, force=False):
    """
    Guarantees that the given merchant has a realistic, full suite of
    sample categories, products, customer profiles, orders, and flagged returns.
    """
    if not merchant:
        return {"products": 0, "orders": 0}

    # 1. Categories
    cat_map = {}
    for item in SAMPLE_PRODUCTS_CONFIG:
        cslug = item["cat_slug"]
        cat_id = f"cat_{merchant.id}_{cslug}"[:64]
        cat = Category.objects.filter(merchant=merchant, slug=cslug).first()
        if not cat:
            cat = Category.objects.filter(id=cat_id).first()
        if not cat:
            cat = Category.objects.create(
                id=cat_id,
                merchant=merchant,
                name=item["cat_name"],
                slug=cslug,
                description=item["cat_desc"],
            )
        cat_map[cslug] = cat

    # 2. Products
    products_created = []
    prod_map = {}
    existing_prods = list(Product.objects.filter(merchant=merchant))
    
    if len(existing_prods) < 12 or force:
        for idx, item in enumerate(SAMPLE_PRODUCTS_CONFIG, 1):
            p_id = f"prod_{merchant.id[-4:].lower()}_{idx}"
            prod = Product.objects.filter(merchant=merchant, name=item["name"]).first()
            if not prod:
                prod = Product.objects.filter(id=p_id).first()
            if not prod:
                prod = Product.objects.create(
                    id=p_id,
                    merchant=merchant,
                    category=cat_map.get(item["cat_slug"]),
                    name=item["name"],
                    price=item["price"],
                    original_price=item["original_price"],
                    stock=item["stock"],
                    image=item["image"],
                    description=item["description"],
                    rating=item["rating"],
                    review_count=item["review_count"],
                    is_active=True,
                )
                products_created.append(prod)
            prod_map[idx] = prod
    else:
        for idx, p in enumerate(existing_prods, 1):
            prod_map[idx] = p

    all_merchant_prods = list(Product.objects.filter(merchant=merchant))

    # 3. Shoppers
    shopper_users = {}
    for c_info in SAMPLE_CUSTOMERS_CONFIG:
        u, _ = User.objects.get_or_create(
            email=c_info["email"],
            defaults={
                "name": c_info["name"],
                "phone": c_info["phone"],
                "role": User.ROLE_SHOPPER,
            },
        )
        u.set_password("demo123")
        u.name = c_info["name"]
        u.phone = c_info["phone"]
        u.save()
        shopper_users[c_info["email"]] = u

        sprof, _ = ShopperProfile.objects.get_or_create(
            user=u,
            defaults={
                "merchant": merchant,
                "customer_id": f"CUST-{u.id or 1000}",
                "risk_tier": c_info["risk_tier"],
                "total_orders": c_info["total_orders"],
                "total_returns": c_info["total_returns"],
                "total_cod_refusals": c_info["total_cod_refusals"],
                "reward_points": c_info["reward_points"],
            },
        )
        if c_info["address"] and not sprof.addresses.exists():
            Address.objects.create(
                shopper=sprof,
                line=c_info["address"],
                label="Home",
                is_primary=True,
            )

    # 4. Orders
    existing_orders_count = Order.objects.filter(merchant=merchant).count()
    orders_created = []

    if existing_orders_count < 10 or force:
        now = timezone.now()
        p1 = all_merchant_prods[0] if len(all_merchant_prods) > 0 else None
        p2 = all_merchant_prods[1] if len(all_merchant_prods) > 1 else p1
        p3 = all_merchant_prods[2] if len(all_merchant_prods) > 2 else p1
        p4 = all_merchant_prods[3] if len(all_merchant_prods) > 3 else p1
        p5 = all_merchant_prods[4] if len(all_merchant_prods) > 4 else p1
        p6 = all_merchant_prods[5] if len(all_merchant_prods) > 5 else p1
        p7 = all_merchant_prods[6] if len(all_merchant_prods) > 6 else p1
        p8 = all_merchant_prods[7] if len(all_merchant_prods) > 7 else p1
        p9 = all_merchant_prods[8] if len(all_merchant_prods) > 8 else p1
        p10 = all_merchant_prods[9] if len(all_merchant_prods) > 9 else p1
        p11 = all_merchant_prods[10] if len(all_merchant_prods) > 10 else p1
        p12 = all_merchant_prods[11] if len(all_merchant_prods) > 11 else p1
        p13 = all_merchant_prods[12] if len(all_merchant_prods) > 12 else p1
        p14 = all_merchant_prods[13] if len(all_merchant_prods) > 13 else p1
        p15 = all_merchant_prods[14] if len(all_merchant_prods) > 14 else p1
        p16 = all_merchant_prods[15] if len(all_merchant_prods) > 15 else p1

        orders_plan = [
            # 1. High-risk COD in manual review
            {
                "num": f"ORD-{merchant.id[-4:].upper()}-1025",
                "email": "rohit@example.com",
                "pay": "COD",
                "status": "Review",
                "delivery": "Pending Review",
                "risk": "High",
                "verification": "Flagged",
                "days_ago": 1,
                "items": [(p1, 1)],
            },
            # 2. Medium-risk UPI in transit
            {
                "num": f"ORD-{merchant.id[-4:].upper()}-1024",
                "email": "ananya@example.com",
                "pay": "UPI",
                "status": "Confirmed",
                "delivery": "In Transit",
                "risk": "Medium",
                "verification": "Verified",
                "days_ago": 2,
                "items": [(p3, 1)],
            },
            # 3. High-ticket Silk Saree Delivered
            {
                "num": f"ORD-{merchant.id[-4:].upper()}-1023",
                "email": "meera@example.com",
                "pay": "CREDIT_CARD",
                "status": "Delivered",
                "delivery": "Delivered",
                "risk": "Low",
                "verification": "Verified",
                "days_ago": 5,
                "items": [(p2, 1)],
            },
            # 4. Electronics Audio Delivered
            {
                "num": f"ORD-{merchant.id[-4:].upper()}-1022",
                "email": "kavita@example.com",
                "pay": "UPI",
                "status": "Delivered",
                "delivery": "Delivered",
                "risk": "Low",
                "verification": "Verified",
                "days_ago": 6,
                "items": [(p9, 1)],
            },
            # 5. Daily wear shirt in transit
            {
                "num": f"ORD-{merchant.id[-4:].upper()}-1021",
                "email": "raghuvaranraghuvaran65@gmail.com",
                "pay": "CREDIT_CARD",
                "status": "Confirmed",
                "delivery": "In Transit",
                "risk": "Low",
                "verification": "Verified",
                "days_ago": 2,
                "items": [(p5, 2)],
            },
            # 6. Flagged Return Requested (High Risk Rohit)
            {
                "num": f"ORD-{merchant.id[-4:].upper()}-1020",
                "email": "rohit@example.com",
                "pay": "COD",
                "status": "Return Requested",
                "delivery": "Return Requested",
                "risk": "High",
                "verification": "Flagged",
                "days_ago": 4,
                "items": [(p10, 2)],
            },
            # 7. Multi-item Festive Order Delivered
            {
                "num": f"ORD-{merchant.id[-4:].upper()}-1019",
                "email": "priya.sharma@example.com",
                "pay": "UPI",
                "status": "Delivered",
                "delivery": "Delivered",
                "risk": "Low",
                "verification": "Verified",
                "days_ago": 8,
                "items": [(p4, 1), (p14, 1)],
            },
            # 8. Ceramic set Delivered
            {
                "num": f"ORD-{merchant.id[-4:].upper()}-1018",
                "email": "ananya@example.com",
                "pay": "CREDIT_CARD",
                "status": "Delivered",
                "delivery": "Delivered",
                "risk": "Medium",
                "verification": "Verified",
                "days_ago": 10,
                "items": [(p13, 1)],
            },
            # 9. Daily wear tee Delivered
            {
                "num": f"ORD-{merchant.id[-4:].upper()}-1017",
                "email": "meera@example.com",
                "pay": "UPI",
                "status": "Delivered",
                "delivery": "Delivered",
                "risk": "Low",
                "verification": "Verified",
                "days_ago": 12,
                "items": [(p6, 2)],
            },
            # 10. Portable speaker Flagged return
            {
                "num": f"ORD-{merchant.id[-4:].upper()}-1016",
                "email": "rohit@example.com",
                "pay": "COD",
                "status": "Return Requested",
                "delivery": "Return Requested",
                "risk": "High",
                "verification": "Flagged",
                "days_ago": 7,
                "items": [(p11, 1)],
            },
            # 11. Fast charger In Transit
            {
                "num": f"ORD-{merchant.id[-4:].upper()}-1015",
                "email": "raghuvaranraghuvaran65@gmail.com",
                "pay": "UPI",
                "status": "Confirmed",
                "delivery": "In Transit",
                "risk": "Low",
                "verification": "Verified",
                "days_ago": 1,
                "items": [(p12, 1)],
            },
            # 12. Home decor cushion Delivered
            {
                "num": f"ORD-{merchant.id[-4:].upper()}-1014",
                "email": "kavita@example.com",
                "pay": "DEBIT_CARD",
                "status": "Delivered",
                "delivery": "Delivered",
                "risk": "Low",
                "verification": "Verified",
                "days_ago": 14,
                "items": [(p16, 2)],
            },
            # 13. High-ticket Lehenga Delivered
            {
                "num": f"ORD-{merchant.id[-4:].upper()}-1013",
                "email": "priya.sharma@example.com",
                "pay": "UPI",
                "status": "Delivered",
                "delivery": "Delivered",
                "risk": "Low",
                "verification": "Verified",
                "days_ago": 15,
                "items": [(p1, 1)],
            },
            # 14. Linen trousers Processing
            {
                "num": f"ORD-{merchant.id[-4:].upper()}-1012",
                "email": "ananya@example.com",
                "pay": "COD",
                "status": "Confirmed",
                "delivery": "Processing",
                "risk": "Medium",
                "verification": "Verified",
                "days_ago": 1,
                "items": [(p7, 1)],
            },
            # 15. Product Returned & Refund Processed
            {
                "num": f"ORD-{merchant.id[-4:].upper()}-1011",
                "email": "meera@example.com",
                "pay": "CREDIT_CARD",
                "status": "Refund Processed",
                "delivery": "Refund Processed",
                "risk": "Low",
                "verification": "Verified",
                "days_ago": 18,
                "items": [(p3, 1)],
            },
            # 16. Cancelled order
            {
                "num": f"ORD-{merchant.id[-4:].upper()}-1010",
                "email": "rohit@example.com",
                "pay": "COD",
                "status": "Cancelled",
                "delivery": "Cancelled",
                "risk": "High",
                "verification": "Flagged",
                "days_ago": 3,
                "items": [(p8, 1)],
            },
        ]

        created_orders_map = {}
        for plan in orders_plan:
            onum = plan["num"]
            # Ensure unique order number across db
            if Order.objects.filter(order_number=onum).exclude(merchant=merchant).exists():
                onum = f"{onum}-{uuid.uuid4().hex[:4].upper()}"

            ouser = shopper_users.get(plan["email"]) or User.objects.filter(role=User.ROLE_SHOPPER).first()
            if not ouser:
                continue

            # Calculate total
            ototal = Decimal("0.00")
            for prod_item, qty in plan["items"]:
                if prod_item:
                    ototal += Decimal(str(prod_item.price)) * qty
            if ototal == Decimal("0.00"):
                ototal = Decimal("1999.00")

            order_time = now - timedelta(days=plan["days_ago"], hours=3, minutes=15)
            delivered_time = (order_time + timedelta(days=2)) if "Delivered" in plan["delivery"] else None

            order, created = Order.objects.get_or_create(
                order_number=onum,
                defaults={
                    "merchant": merchant,
                    "user": ouser,
                    "customer_name": ouser.name or plan["email"].split("@")[0],
                    "subtotal": ototal,
                    "discount": Decimal("0.00"),
                    "total": ototal,
                    "payment_method": plan["pay"],
                    "status": plan["status"],
                    "delivery_status": plan["delivery"],
                    "delivered_at": delivered_time,
                    "risk_tier": plan["risk"],
                    "verification_status": plan["verification"],
                    "delivery_address": (
                        ouser.shopper_profile.addresses.first().line
                        if hasattr(ouser, "shopper_profile") and ouser.shopper_profile.addresses.exists()
                        else "Flat 204, Palm Grove, Bengaluru 560038"
                    ),
                    "tracking_events": [
                        {"status": "Order Placed", "timestamp": order_time.isoformat(), "location": "System Online"},
                        {"status": "Packed & Dispatched", "timestamp": (order_time + timedelta(hours=18)).isoformat(), "location": "Central Fulfillment Center"},
                        {"status": plan["delivery"], "timestamp": (order_time + timedelta(days=2)).isoformat(), "location": "Destination Delivery Hub"},
                    ],
                },
            )

            # Ensure creation timestamp matches realistic history
            Order.objects.filter(pk=order.pk).update(created_at=order_time)
            created_orders_map[onum] = order

            if created or order.items.count() == 0:
                for prod_item, qty in plan["items"]:
                    if prod_item:
                        OrderItem.objects.create(
                            order=order,
                            product=prod_item,
                            name=prod_item.name,
                            quantity=qty,
                            price=prod_item.price,
                        )

            orders_created.append(order)

        # 5. Return Requests (Flagged Cases)
        returns_plan = [
            {
                "order_num": orders_plan[0]["num"],
                "reason": "Changed Mind",
                "note": "Customer reported package opened; security tag removed.",
                "risk_tier": "High",
                "risk_score": 78,
                "status": "manual_review",
                "outcome": "pending_review",
                "signals": ["Tag removed / seal broken", "High return frequency", "COD refusal history"],
            },
            {
                "order_num": orders_plan[5]["num"],
                "reason": "Defective Item",
                "note": "Claimed battery draining rapidly within 2 hours of unboxing.",
                "risk_tier": "High",
                "risk_score": 72,
                "status": "manual_review",
                "outcome": "pending_review",
                "signals": ["Multiple claims within 7 days", "High value COD escalation"],
            },
            {
                "order_num": orders_plan[9]["num"],
                "reason": "Suspected Fraud",
                "note": "Device mismatch with previous COD refusal history.",
                "risk_tier": "High",
                "risk_score": 85,
                "status": "manual_review",
                "outcome": "pending_review",
                "signals": ["Device mismatch detected", "Suspected serial swap"],
            },
            {
                "order_num": orders_plan[7]["num"],
                "reason": "Color Difference",
                "note": "Slight variation in glazed finish compared to online preview.",
                "risk_tier": "Medium",
                "risk_score": 42,
                "status": "approved",
                "outcome": "legitimate_return",
                "signals": ["Legitimate buyer score", "Photo verified intact"],
            },
        ]

        for r_plan in returns_plan:
            r_order = created_orders_map.get(r_plan["order_num"])
            if not r_order:
                continue
            first_item = r_order.items.first()
            ret_req, r_created = ReturnRequest.objects.get_or_create(
                order=r_order,
                defaults={
                    "merchant": merchant,
                    "user": r_order.user,
                    "customer_name": r_order.customer_name,
                    "reason": r_plan["reason"],
                    "note": r_plan["note"],
                    "risk_tier": r_plan["risk_tier"],
                    "risk_score": r_plan["risk_score"],
                    "status": r_plan["status"],
                    "outcome": r_plan["outcome"],
                    "verification_status": "Flagged" if r_plan["risk_tier"] == "High" else "Verified",
                    "verification_method": "ai_scoring",
                    "signals": r_plan["signals"],
                    "reviewed_by": "demo@merchant.com" if r_plan["status"] == "approved" else "",
                    "reviewed_at": now if r_plan["status"] == "approved" else None,
                },
            )
            if (r_created or ret_req.return_lines.count() == 0) and first_item:
                ReturnLine.objects.create(
                    return_request=ret_req,
                    product=first_item.product,
                    name=first_item.name,
                    quantity=first_item.quantity,
                    price=first_item.price,
                )

    return {
        "products": len(products_created) or len(all_merchant_prods),
        "orders": len(orders_created) or existing_orders_count,
    }
