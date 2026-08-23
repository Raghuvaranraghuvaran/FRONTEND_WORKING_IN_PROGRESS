#!/usr/bin/env bash
# Render build script for Django backend
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate --run-syncdb

# Create demo superuser + seed data if not already present
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()

# Create demo shopper
if not User.objects.filter(email='demo@shopper.com').exists():
    user = User.objects.create_user(email='demo@shopper.com', password='demo123', name='Demo Shopper', role='shopper')
    from accounts.models import ShopperProfile
    ShopperProfile.objects.get_or_create(user=user, defaults={'customer_id': 'CUST-DEMO', 'reward_points': 1000, 'total_orders': 0, 'total_returns': 0})
    print('Created demo shopper')

# Create demo merchant admin
if not User.objects.filter(email='demo@merchant.com').exists():
    user = User.objects.create_user(email='demo@merchant.com', password='demo123', name='Demo Merchant', role='merchant_admin')
    # Create merchant tenant
    from merchants.models import Merchant, MerchantProfile
    merchant, created = Merchant.objects.get_or_create(
        store_slug='aria-fashion-house',
        defaults={
            'business_name': 'Aria Fashion House',
            'admin_email': 'demo@merchant.com',
        }
    )
    MerchantProfile.objects.get_or_create(user=user, defaults={'merchant': merchant})
    # Seed default categories
    from catalog.models import Category
    from django.utils.text import slugify
    for cat_id, name, desc in [
        ('cat_ethnic', 'Ethnic Wear', 'Kurtas, sarees, lehengas and festive wear'),
        ('cat_daily', 'Daily Wear', 'Everyday tops, shirts and basics'),
        ('cat_electronics', 'Electronics', 'Gadgets and accessories'),
        ('cat_home', 'Home', 'Home and living essentials'),
    ]:
        Category.objects.get_or_create(id=cat_id, merchant=merchant, defaults={'name': name, 'description': desc, 'slug': slugify(name)})
    print('Created demo merchant + categories')

print('Seed complete')
"
