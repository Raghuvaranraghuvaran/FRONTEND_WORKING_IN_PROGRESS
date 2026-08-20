from django.contrib.auth import get_user_model
from django.db import transaction

from .models import Merchant, MerchantProfile

User = get_user_model()


def create_merchant_with_admin(*, business_name, store_slug, admin_email, password=None):
    """Create a merchant tenant and its admin user atomically."""
    with transaction.atomic():
        merchant = Merchant.objects.create(
            business_name=business_name,
            store_slug=store_slug,
            admin_email=admin_email,
        )
        user = User.objects.create_user(
            email=admin_email,
            password=password or User.objects.make_random_password(),
            name=admin_email.split("@")[0].replace(".", " ").title(),
            role=User.ROLE_MERCHANT_ADMIN,
        )
        MerchantProfile.objects.create(user=user, merchant=merchant)
        return merchant, user
