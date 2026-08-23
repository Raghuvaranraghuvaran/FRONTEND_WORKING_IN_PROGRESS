#!/usr/bin/env bash
set -e

# Ensure database tables exist
python manage.py migrate --no-input

# Seed default demo accounts and categories
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()

if not User.objects.filter(email='demo@shopper.com').exists():
    user = User.objects.create_user(email='demo@shopper.com', password='demo123', name='Demo Shopper', role='shopper')
    from accounts.models import ShopperProfile
    ShopperProfile.objects.get_or_create(user=user, defaults={'customer_id': 'CUST-DEMO', 'reward_points': 1000, 'total_orders': 0, 'total_returns': 0})
    print('Created demo shopper')

if not User.objects.filter(email='demo@merchant.com').exists():
    user = User.objects.create_user(email='demo@merchant.com', password='demo123', name='Demo Merchant', role='merchant_admin')
    from merchants.models import Merchant, MerchantProfile
    merchant, _ = Merchant.objects.get_or_create(
        store_slug='aria-fashion-house',
        defaults={'business_name': 'Aria Fashion House', 'admin_email': 'demo@merchant.com'}
    )
    MerchantProfile.objects.get_or_create(user=user, defaults={'merchant': merchant})
    from catalog.models import Category, Product
    from django.utils.text import slugify
    categories_map = {}
    for cat_id, name, desc in [
        ('cat_ethnic', 'Ethnic Wear', 'Kurtas, sarees, lehengas and festive wear'),
        ('cat_daily', 'Daily Wear', 'Everyday tops, shirts and basics'),
        ('cat_electronics', 'Electronics', 'Gadgets and accessories'),
        ('cat_home', 'Home', 'Home and living essentials'),
    ]:
        c, _ = Category.objects.get_or_create(id=cat_id, merchant=merchant, defaults={'name': name, 'description': desc, 'slug': slugify(name)})
        categories_map[cat_id] = c

    if Product.objects.count() == 0:
        sample_prods = [
            ('prod_1', 'cat_ethnic', 'Embroidered Lehenga Set', 6499, 12, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80', 'Festive three-piece lehenga set with mirror work.'),
            ('prod_2', 'cat_ethnic', 'Silk Banarasi Saree', 8999, 8, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80', 'Handwoven Banarasi silk saree for weddings.'),
            ('prod_3', 'cat_ethnic', 'Designer Kurta Set', 2499, 20, 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=600&q=80', 'Comfortable festive kurta with matching bottoms.'),
            ('prod_4', 'cat_daily', 'Cotton Shirt', 1299, 40, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80', 'Breathable everyday cotton shirt.'),
            ('prod_5', 'cat_daily', 'Relaxed Fit T-Shirt', 799, 60, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80', 'Soft relaxed-fit tee for daily wear.'),
            ('prod_6', 'cat_daily', 'Linen Trouser', 1999, 25, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=80', 'Tailored linen trousers for work or casual looks.'),
            ('prod_7', 'cat_electronics', 'Wireless Earbuds', 3999, 15, 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=600&q=80', 'Compact earbuds with active noise cancellation.'),
            ('prod_8', 'cat_electronics', 'Smart Fitness Band', 2799, 30, 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=600&q=80', 'Tracks activity, sleep and heart rate.'),
            ('prod_9', 'cat_home', 'Ceramic Dinner Set', 3499, 18, 'https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=600&q=80', 'Twelve-piece ceramic dinnerware set.'),
            ('prod_10', 'cat_home', 'Decorative Table Lamp', 1899, 22, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80', 'Warm ambient lamp for living spaces.'),
            ('prod_11', 'cat_ethnic', 'Chanderi Anarkali Dress', 3299, 14, 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80', 'Lightweight Chanderi Anarkali with delicate gold detailing.'),
            ('prod_12', 'cat_ethnic', 'Printed Cotton Dupatta', 899, 28, 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80', 'Hand-block inspired cotton dupatta for everyday festive styling.'),
            ('prod_13', 'cat_daily', 'Oversized Linen Shirt', 1799, 24, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80', 'Relaxed linen shirt designed for warm-weather comfort.'),
            ('prod_14', 'cat_daily', 'Everyday Canvas Sneakers', 2199, 32, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80', 'Cushioned low-top sneakers for daily commutes and weekends.'),
            ('prod_15', 'cat_electronics', 'Portable Bluetooth Speaker', 2499, 19, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80', 'Compact wireless speaker with rich sound for indoor and outdoor use.'),
            ('prod_16', 'cat_electronics', 'Fast Charge Power Bank', 1599, 26, 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80', 'High-capacity power bank with USB-C fast charging.'),
            ('prod_17', 'cat_home', 'Woven Storage Basket', 1299, 21, 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=600&q=80', 'Textured woven basket for throws, toys, and everyday storage.'),
            ('prod_18', 'cat_home', 'Cotton Cushion Cover Set', 749, 35, 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80', 'Set of two soft cotton cushion covers with modern patterns.'),
        ]
        for pid, cid, name, price, stock, img, desc in sample_prods:
            Product.objects.get_or_create(id=pid, defaults={'merchant': merchant, 'category': categories_map.get(cid), 'name': name, 'price': price, 'stock': stock, 'image': img, 'description': desc, 'is_active': True})
        print('Seeded 18 default products')
" || true

exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}

