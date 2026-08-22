from django.contrib.auth import authenticate, get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from common.exceptions import AppError
from common.permissions import IsMerchantAdmin
from common.response import success
from common.tenancy import get_merchant_from_user
from accounts.services import tokens_for_user
from accounts.serializers import LoginOTPRequestSerializer, LoginOTPVerifySerializer
from verification.services import OTPVerificationService
from .serializers import MerchantRegisterSerializer, MerchantSerializer

User = get_user_model()


class MerchantListView(APIView):
    """Create a merchant tenant (frontend onboarding posts here)."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = MerchantRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        merchant = serializer.save()
        return success(MerchantSerializer(merchant).data, status=status.HTTP_201_CREATED)


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


class MerchantLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip()
        password = request.data.get("password", "")
        user = authenticate(request, email=email, password=password)
        if user is None or not user.is_merchant_admin:
            raise AppError("Invalid merchant credentials.", code="INVALID_CREDENTIALS")
        return success(merchant_login_payload(user))



def _seed_default_categories(merchant):
    """Create default categories for a newly provisioned merchant."""
    from django.utils.text import slugify
    from catalog.models import Category

    defaults = [
        ("cat_ethnic", "Ethnic Wear", "Kurtas, sarees, lehengas and festive wear"),
        ("cat_daily",  "Daily Wear",  "Everyday tops, shirts and basics"),
        ("cat_electronics", "Electronics", "Gadgets and accessories"),
        ("cat_home",   "Home",         "Home and living essentials"),
    ]
    for cat_id, name, description in defaults:
        Category.objects.get_or_create(
            id=cat_id,
            merchant=merchant,
            defaults={"name": name, "description": description, "slug": slugify(name)},
        )


def merchant_login_payload(user):
    merchant = get_merchant_from_user(user)
    if merchant is None:
        # Auto-provision merchant for new OTP / Google sign-in users
        from merchants.models import Merchant, MerchantProfile
        slug = user.email.split("@")[0].lower().replace(".", "-")[:40]
        merchant, created = Merchant.objects.get_or_create(
            store_slug=slug,
            defaults={
                "business_name": f"{user.name or slug}'s Store",
                "admin_email": user.email,
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
        # Ensure existing merchants also have default categories
        from catalog.models import Category
        if not Category.objects.filter(merchant=merchant).exists():
            _seed_default_categories(merchant)
    return {
        "tokens": tokens_for_user(user),
        "admin": {"id": user.id, "email": user.email, "name": user.name, "role": user.role},
        "merchant": MerchantSerializer(merchant).data,
    }


class MerchantGoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            from accounts.google_auth import verify_google_id_token
            from accounts.serializers import GoogleLoginSerializer

            serializer = GoogleLoginSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            profile = verify_google_id_token(serializer.validated_data["credential"])

            user = User.objects.filter(email__iexact=profile["email"]).first()
            if user is None:
                user = User.objects.create_user(
                    email=profile["email"],
                    name=profile["name"],
                    role=User.ROLE_MERCHANT_ADMIN,
                )
            elif user.role != User.ROLE_MERCHANT_ADMIN:
                user.role = User.ROLE_MERCHANT_ADMIN
                user.save(update_fields=["role"])

            return success(merchant_login_payload(user))
        except Exception as exc:
            import logging
            logging.getLogger(__name__).exception("Merchant Google login error: %s", exc)
            msg = str(exc) if str(exc) else "Merchant Google Sign-In failed."
            raise AppError(msg, code="GOOGLE_LOGIN_FAILED")


class MerchantOTPRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginOTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return success(OTPVerificationService().request_login_otp(
            email=serializer.validated_data["email"], role=User.ROLE_MERCHANT_ADMIN
        ))


class MerchantOTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginOTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = OTPVerificationService().verify_login_otp(
            email=serializer.validated_data["email"], role=User.ROLE_MERCHANT_ADMIN,
            challenge_id=serializer.validated_data["challenge_id"], code=serializer.validated_data["code"],
        )
        return success(merchant_login_payload(user))
