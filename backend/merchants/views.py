import re
import threading
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from common.exceptions import AppError
from common.permissions import IsMerchantAdmin
from common.response import success
from common.tenancy import get_merchant_from_user
from accounts.services import tokens_for_user
from .models import Merchant, MerchantProfile
from .serializers import MerchantSerializer

User = get_user_model()


def _send_merchant_welcome_email(dest_email, merchant_username, business_name):
    """Asynchronously dispatches credential email to registered merchant."""
    def _task():
        try:
            subject = "Your ReturnGuard Merchant Account"
            message = (
                "Welcome to ReturnGuard.\n\n"
                "Your merchant account has been successfully created.\n\n"
                f"Merchant Username:\n{merchant_username}\n\n"
                f"Your account was registered with:\n{dest_email}\n\n"
                "You can use your merchant username and password to access your Merchant Dashboard.\n\n"
                "Please keep your credentials secure.\n\n"
                "— The ReturnGuard Team"
            )
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[dest_email],
                fail_silently=True,
            )
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("Merchant welcome email failed: %s", exc)

    t = threading.Thread(target=_task, daemon=True)
    t.start()


class MerchantRegisterView(APIView):
    """
    Registers a new merchant account:
    - Validates Name, Email, Password, Business Name, Store Slug.
    - Generates unique backend merchant_username (e.g. SAIFASHION4827).
    - Hashes password securely via User.objects.create_user.
    - Permanently associates email with merchant_username and store.
    - Sends credentials email to registered email.
    - Returns details for the Success Modal without auto-logging in.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        name = (request.data.get("name") or "").strip()
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""
        business_name = (request.data.get("business_name") or "").strip()
        store_slug = (request.data.get("store_slug") or "").strip().lower()

        # Validations
        if not name:
            raise AppError("Name is required.", code="NAME_REQUIRED")
        if not email:
            raise AppError("Email is required.", code="EMAIL_REQUIRED")
        try:
            validate_email(email)
        except ValidationError:
            raise AppError("Please provide a valid email address.", code="INVALID_EMAIL")

        if not password:
            raise AppError("Password is required.", code="PASSWORD_REQUIRED")
        if len(password) < 6:
            raise AppError("Password must be at least 6 characters.", code="PASSWORD_TOO_SHORT")

        if not business_name:
            raise AppError("Business Name is required.", code="BUSINESS_NAME_REQUIRED")
        if not store_slug:
            raise AppError("Store Slug is required.", code="STORE_SLUG_REQUIRED")
        if not re.match(r"^[a-z0-9-]+$", store_slug):
            raise AppError("Store Slug can only contain lowercase letters, numbers, and hyphens.", code="INVALID_SLUG")

        # Uniqueness checks
        if User.objects.filter(email__iexact=email).exists() or Merchant.objects.filter(admin_email__iexact=email).exists():
            raise AppError("Email is already registered.", code="EMAIL_EXISTS")

        if Merchant.objects.filter(store_slug=store_slug).exists():
            raise AppError("Store slug is already in use.", code="STORE_SLUG_EXISTS")

        # Generate unique merchant username
        merchant_username = Merchant.generate_unique_merchant_username(business_name)

        # Create Merchant tenant
        merchant = Merchant.objects.create(
            business_name=business_name,
            store_slug=store_slug,
            admin_email=email,
            merchant_username=merchant_username,
        )

        # Create User with hashed password
        user = User.objects.create_user(
            email=email,
            name=name,
            password=password,
            role=User.ROLE_MERCHANT_ADMIN,
            merchant_username=merchant_username,
        )

        # Associate Profile
        MerchantProfile.objects.create(user=user, merchant=merchant)
        _seed_default_categories(merchant)

        # Send welcome credentials email
        _send_merchant_welcome_email(email, merchant_username, business_name)

        return success(
            {
                "merchant_username": merchant_username,
                "email": email,
                "name": name,
                "business_name": business_name,
                "store_slug": store_slug,
            },
            status=status.HTTP_201_CREATED,
        )


class MerchantLoginView(APIView):
    """
    Authenticates merchant using ONLY:
    - Merchant Username
    - Password
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get("username") or request.data.get("merchant_username") or "").strip().upper()
        password = request.data.get("password") or ""

        if not username or not password:
            raise AppError("Invalid username or password.", code="INVALID_CREDENTIALS")

        # Find user by merchant_username
        user = User.objects.filter(merchant_username__iexact=username, role=User.ROLE_MERCHANT_ADMIN).first()
        if user is None:
            # Fallback: check Merchant record by merchant_username and grab admin user
            merchant = Merchant.objects.filter(merchant_username__iexact=username).first()
            if merchant and merchant.admins.exists():
                user = merchant.admins.first().user

        if user is None or not user.check_password(password) or not user.is_merchant_admin:
            raise AppError("Invalid username or password.", code="INVALID_CREDENTIALS")

        return success(merchant_login_payload(user))


class MerchantMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        merchant = get_merchant_from_user(request.user)
        if merchant is None:
            raise AppError("No merchant context.", code="MERCHANT_NOT_FOUND")
        return success(MerchantSerializer(merchant).data)

    def patch(self, request):
        merchant = get_merchant_from_user(request.user)
        if merchant is None:
            raise AppError("No merchant context.", code="MERCHANT_NOT_FOUND")
        allowed = {"business_name", "plan_tier", "admin_email"}
        for field, value in request.data.items():
            if field in allowed:
                setattr(merchant, field, value)
        merchant.save()
        return success(MerchantSerializer(merchant).data)


def _seed_default_categories(merchant):
    """Create default categories for a newly provisioned merchant."""
    from django.utils.text import slugify
    from catalog.models import Category

    defaults = [
        ("Ethnic Wear", "Kurtas, sarees, lehengas and festive wear"),
        ("Daily Wear",  "Everyday tops, shirts and basics"),
        ("Electronics", "Gadgets and accessories"),
        ("Home",         "Home and living essentials"),
    ]
    for cat_name, description in defaults:
        slug = slugify(cat_name)
        cat_id = f"cat_{merchant.id}_{slug}"[:64]
        Category.objects.get_or_create(
            merchant=merchant,
            name=cat_name,
            defaults={
                "id": cat_id,
                "description": description,
                "slug": slug,
            },
        )


def merchant_login_payload(user):
    merchant = get_merchant_from_user(user)
    if merchant is None:
        from merchants.models import Merchant, MerchantProfile
        slug = user.email.split("@")[0].lower().replace(".", "-")[:40]
        merchant, created = Merchant.objects.get_or_create(
            store_slug=slug,
            defaults={
                "business_name": f"{user.name or slug}'s Store",
                "admin_email": user.email,
                "merchant_username": getattr(user, "merchant_username", None) or Merchant.generate_unique_merchant_username(user.name),
            }
        )
        MerchantProfile.objects.update_or_create(
            user=user,
            defaults={"merchant": merchant}
        )
        user.role = User.ROLE_MERCHANT_ADMIN
        user.save(update_fields=["role"])
        if created:
            _seed_default_categories(merchant)
    else:
        from catalog.models import Category
        if not Category.objects.filter(merchant=merchant).exists():
            _seed_default_categories(merchant)
    return {
        "tokens": tokens_for_user(user),
        "admin": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "merchant_username": user.merchant_username or getattr(merchant, "merchant_username", ""),
        },
        "merchant": MerchantSerializer(merchant).data,
    }
