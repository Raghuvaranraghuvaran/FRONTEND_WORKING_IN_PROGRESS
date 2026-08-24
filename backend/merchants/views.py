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


def _send_merchant_welcome_email(dest_email, merchant_username, password, business_name, store_slug="", name=""):
    """Asynchronously dispatches rich HTML credential email with username and password to registered merchant."""
    from common.mailer import send_async_email
    subject = f"Your ReturnGuard Merchant Credentials - {business_name}"
    
    html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your ReturnGuard Merchant Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0f19; padding: 40px 15px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #111827; border-radius: 16px; overflow: hidden; border: 1px solid #1f2937; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); padding: 32px 28px; text-align: center;">
                            <div style="display: inline-block; background: rgba(255, 255, 255, 0.15); width: 44px; height: 44px; line-height: 44px; border-radius: 50%; font-size: 22px; margin-bottom: 10px;">🏪</div>
                            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">Welcome to ReturnGuard</h1>
                            <p style="margin: 6px 0 0; font-size: 13px; color: #c7d2fe;">Merchant Portal & Risk Management Platform</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px 28px;">
                            <p style="margin: 0 0 16px; font-size: 15px; color: #f3f4f6; line-height: 1.5;">
                                Hi <strong>{name or business_name}</strong>,<br>
                                Your merchant store account has been successfully created. Here are your official sign-in credentials:
                            </p>
                            
                            <!-- Credentials Card -->
                            <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 20px 0;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding: 6px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Merchant Username:</td>
                                        <td style="padding: 6px 0; font-size: 15px; color: #38bdf8; font-weight: 800; font-family: monospace; text-align: right;">{merchant_username}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Password:</td>
                                        <td style="padding: 6px 0; font-size: 14px; color: #34d399; font-weight: 700; font-family: monospace; text-align: right;">{password}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Store Name:</td>
                                        <td style="padding: 6px 0; font-size: 14px; color: #ffffff; font-weight: 700; text-align: right;">{business_name}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Registered Email:</td>
                                        <td style="padding: 6px 0; font-size: 13px; color: #cbd5e1; text-align: right;">{dest_email}</td>
                                    </tr>
                                    {f'<tr><td style="padding: 6px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Store Slug:</td><td style="padding: 6px 0; font-size: 13px; color: #a78bfa; font-family: monospace; text-align: right;">{store_slug}</td></tr>' if store_slug else ''}
                                </table>
                            </div>

                            <p style="margin: 0 0 24px; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                                🔐 <strong>Sign-in Instructions:</strong> Use your <strong>Merchant Username</strong> (<code>{merchant_username}</code>) and your password to sign in to the Merchant Portal.
                            </p>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 28px 0 10px;">
                                <a href="http://localhost:5174/merchant/login" style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: 700; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);">
                                    Log In to Merchant Portal →
                                </a>
                            </div>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #0b0f19; padding: 20px 28px; border-top: 1px solid #1f2937; text-align: center;">
                            <p style="margin: 0; font-size: 11px; color: #64748b;">
                                © ReturnGuard · E-Commerce Fraud Prevention & Return Intelligence
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""

    message = (
        f"Welcome to ReturnGuard, {business_name}!\n\n"
        "Your merchant account has been successfully created.\n\n"
        f"Merchant Username: {merchant_username}\n"
        f"Password:          {password}\n"
        f"Registered Email:  {dest_email}\n"
        f"Store Name:        {business_name}\n\n"
        "Sign In URL: http://localhost:5174/merchant/login\n\n"
        "Use your Merchant Username and password to log in.\n\n"
        "— The ReturnGuard Team"
    )

    send_async_email(
        subject=subject,
        message=message,
        html_message=html_body,
        recipient_list=[dest_email],
        from_name="ReturnGuard Merchant Support",
    )


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
        address = (request.data.get("address") or "").strip()
        city = (request.data.get("city") or "").strip()
        state_val = (request.data.get("state") or "").strip()
        pincode = (request.data.get("pincode") or "").strip()
        phone = (request.data.get("phone") or "").strip()
        gstin = (request.data.get("gstin") or "").strip()

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

        import secrets

        # Generate or reuse unique merchant username
        existing_user = User.objects.filter(email__iexact=email).first()
        existing_merchant = Merchant.objects.filter(admin_email__iexact=email).first()

        # Handle store slug uniqueness
        effective_slug = store_slug
        slug_match = Merchant.objects.filter(store_slug=effective_slug).exclude(admin_email__iexact=email).exists()
        if slug_match:
            effective_slug = f"{store_slug}-{secrets.randbelow(900) + 100}"

        if existing_user:
            user = existing_user
            user.name = name or user.name
            user.set_password(password)
            user.role = User.ROLE_MERCHANT_ADMIN
            
            if existing_merchant:
                merchant = existing_merchant
                merchant.business_name = business_name
                merchant.store_slug = effective_slug
                if address: merchant.address = address
                if city: merchant.city = city
                if state_val: merchant.state = state_val
                if pincode: merchant.pincode = pincode
                if phone: merchant.phone = phone
                if gstin: merchant.gstin = gstin
                if not merchant.merchant_username:
                    merchant.merchant_username = Merchant.generate_unique_merchant_username(business_name)
                merchant.save()
                merchant_username = merchant.merchant_username
            else:
                merchant_username = getattr(user, 'merchant_username', '') or Merchant.generate_unique_merchant_username(business_name)
                merchant = Merchant.objects.create(
                    business_name=business_name,
                    store_slug=effective_slug,
                    admin_email=email,
                    merchant_username=merchant_username,
                    address=address,
                    city=city,
                    state=state_val,
                    pincode=pincode,
                    phone=phone,
                    gstin=gstin,
                )

            user.merchant_username = merchant_username
            user.save()
            MerchantProfile.objects.get_or_create(user=user, defaults={"merchant": merchant})
            _seed_default_categories(merchant)
        else:
            merchant_username = Merchant.generate_unique_merchant_username(business_name)
            merchant = Merchant.objects.create(
                business_name=business_name,
                store_slug=effective_slug,
                admin_email=email,
                merchant_username=merchant_username,
                address=address,
                city=city,
                state=state_val,
                pincode=pincode,
                phone=phone,
                gstin=gstin,
            )
            user = User.objects.create_user(
                email=email,
                name=name,
                password=password,
                role=User.ROLE_MERCHANT_ADMIN,
                merchant_username=merchant_username,
            )
            MerchantProfile.objects.create(user=user, merchant=merchant)
            _seed_default_categories(merchant)

        # Send welcome credentials email with username and password
        _send_merchant_welcome_email(email, merchant_username, password, business_name, store_slug=effective_slug, name=name)

        print("\n==========================================")
        print(f"[ReturnGuard Merchant Registered] Store: {business_name}")
        print(f"[ReturnGuard Merchant Registered] Email: {email}")
        print(f"[ReturnGuard Merchant Registered] Address: {address}, {city} {pincode}")
        print(f"[ReturnGuard Merchant Registered] Username: {merchant_username}")
        print(f"[ReturnGuard Merchant Registered] Password: {password}")
        print("==========================================\n")

        return success(
            {
                "merchant_username": merchant_username,
                "email": email,
                "name": name,
                "business_name": business_name,
                "store_slug": effective_slug,
                "address": address,
                "city": city,
                "state": state_val,
                "pincode": pincode,
                "phone": phone,
                "gstin": gstin,
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
        password = (request.data.get("password") or "").strip()

        if not username or not password:
            raise AppError("Invalid username or password.", code="INVALID_CREDENTIALS")

        # Auto-provision/heal demo merchant on-demand if requested (guarantees demo credentials always work across local and cloud environments)
        if username in {"ARIAFASHION4827", "DEMO@MERCHANT.COM", "ADMIN@RETURNGUARD.IN"} and password in {"demo123", "demo"}:
            user = User.objects.filter(email__iexact="demo@merchant.com").first() or User.objects.filter(merchant_username="ARIAFASHION4827").first()
            merchant = Merchant.objects.filter(store_slug="aria-fashion-house").first() or Merchant.objects.filter(merchant_username="ARIAFASHION4827").first()
            if merchant is None:
                merchant = Merchant.objects.create(
                    business_name="Aria Fashion House",
                    store_slug="aria-fashion-house",
                    admin_email="demo@merchant.com",
                    merchant_username="ARIAFASHION4827",
                )
            else:
                if merchant.merchant_username != "ARIAFASHION4827":
                    merchant.merchant_username = "ARIAFASHION4827"
                    merchant.save(update_fields=["merchant_username"])

            if user is None:
                user = User.objects.create_user(
                    email="demo@merchant.com",
                    name="Aria Admin",
                    password="demo123",
                    role=User.ROLE_MERCHANT_ADMIN,
                    merchant_username="ARIAFASHION4827",
                )
            else:
                user.set_password("demo123")
                user.merchant_username = "ARIAFASHION4827"
                user.role = User.ROLE_MERCHANT_ADMIN
                user.save()

            MerchantProfile.objects.get_or_create(user=user, defaults={"merchant": merchant})
            
            # Ensure demo dataset is populated if empty
            from orders.models import Order
            if Order.objects.filter(merchant=merchant).count() == 0:
                from django.core.management import call_command
                try:
                    call_command("seed_demo")
                except Exception:
                    pass

            return success(merchant_login_payload(user))

        # Find user by merchant_username
        user = User.objects.filter(merchant_username__iexact=username, role=User.ROLE_MERCHANT_ADMIN).first()
        if user is None:
            # Fallback: check by email in case merchant entered email as username
            user = User.objects.filter(email__iexact=username, role=User.ROLE_MERCHANT_ADMIN).first()
        if user is None:
            # Fallback: check Merchant record by merchant_username and grab admin user
            merchant = Merchant.objects.filter(merchant_username__iexact=username).first()
            if merchant and merchant.admins.exists():
                user = merchant.admins.first().user

        if user is None or not user.check_password(password) or not user.is_merchant_admin:
            raise AppError("Invalid username or password.", code="INVALID_CREDENTIALS")

        return success(merchant_login_payload(user))


class MerchantOTPRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from accounts.serializers import LoginOTPRequestSerializer
        from verification.services import OTPVerificationService

        serializer = LoginOTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return success(
            OTPVerificationService().request_login_otp(
                email=serializer.validated_data["email"],
                role=User.ROLE_MERCHANT_ADMIN,
            )
        )


class MerchantOTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from accounts.serializers import LoginOTPVerifySerializer
        from verification.services import OTPVerificationService

        serializer = LoginOTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = OTPVerificationService().verify_login_otp(
            email=serializer.validated_data["email"],
            role=User.ROLE_MERCHANT_ADMIN,
            challenge_id=serializer.validated_data.get("challenge_id"),
            code=serializer.validated_data["code"],
        )
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
        allowed = {
            "business_name",
            "plan_tier",
            "admin_email",
            "address",
            "city",
            "state",
            "pincode",
            "phone",
            "gstin",
            "return_window_days",
        }
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
