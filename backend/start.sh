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
    ShopperProfile.objects.get_or_create(user=user, defaults={'customer_id': 'CUST-DEMO'})
    print('Created demo shopper')

if not User.objects.filter(email='demo@merchant.com').exists():
    user = User.objects.create_user(email='demo@merchant.com', password='demo123', name='Demo Merchant', role='merchant_admin')
    from merchants.models import Merchant, MerchantProfile
    merchant, _ = Merchant.objects.get_or_create(
        store_slug='aria-fashion-house',
        defaults={'business_name': 'Aria Fashion House', 'admin_email': 'demo@merchant.com'}
    )
    MerchantProfile.objects.get_or_create(user=user, defaults={'merchant': merchant})
    from catalog.models import Category
    from django.utils.text import slugify
    for cat_id, name, desc in [
        ('cat_ethnic', 'Ethnic Wear', 'Kurtas, sarees, lehengas and festive wear'),
        ('cat_daily', 'Daily Wear', 'Everyday tops, shirts and basics'),
        ('cat_electronics', 'Electronics', 'Gadgets and accessories'),
        ('cat_home', 'Home', 'Home and living essentials'),
    ]:
        Category.objects.get_or_create(id=cat_id, merchant=merchant, defaults={'name': name, 'description': desc, 'slug': slugify(name)})
    print('Created demo merchant')
" || true

exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}

