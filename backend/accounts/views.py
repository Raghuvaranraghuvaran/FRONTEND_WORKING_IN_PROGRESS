from django.contrib.auth import authenticate, get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from common.exceptions import NotFoundError
from common.response import success
from .google_auth import verify_google_id_token
from .models import Address, ShopperProfile
from .serializers import (
    AddressSerializer,
    ForgotPasswordRequestSerializer,
    GoogleLoginSerializer,
    LoginSerializer,
    LoginOTPRequestSerializer,
    LoginOTPVerifySerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    ShopperSerializer,
)
from .services import tokens_for_user
from verification.services import OTPVerificationService

from common.mailer import send_async_email

User = get_user_model()


def _send_welcome_email(user):
    if not user or not getattr(user, "email", None):
        return
    send_async_email(
        subject="Welcome to ReturnGuard!",
        message=(
            f"Hello {user.name or 'Shopper'},\n\n"
            f"Welcome to ReturnGuard! Your account ({user.email}) has been successfully created.\n\n"
            "You can explore products, place orders, and manage easy returns with full buyer protection.\n\n"
            "— The ReturnGuard Team"
        ),
        recipient_list=[user.email],
    )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        _send_welcome_email(user)
        return success(
            {"tokens": tokens_for_user(user), "user": ShopperSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if user is None or not user.is_shopper:
            from common.exceptions import AppError

            raise AppError("Invalid email or password.", code="INVALID_CREDENTIALS")
        return success({"tokens": tokens_for_user(user), "user": ShopperSerializer(user).data})


class GoogleLoginView(APIView):
    """Exchange a Google Identity Services credential for our JWT."""

    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = GoogleLoginSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            google_profile = verify_google_id_token(serializer.validated_data["credential"])

            user = User.objects.filter(email__iexact=google_profile["email"]).first()
            created = False
            if user is None:
                user = User.objects.create_user(
                    email=google_profile["email"],
                    name=google_profile["name"],
                    role=User.ROLE_SHOPPER,
                )
                created = True
            elif user.role != User.ROLE_SHOPPER:
                user.role = User.ROLE_SHOPPER
                user.save(update_fields=["role"])

            ShopperProfile.objects.get_or_create(
                user=user,
                defaults={
                    "customer_id": f"CUST-{user.id + 1000}",
                    "total_orders": 0,
                    "total_returns": 0,
                    "total_cod_refusals": 0,
                    "reward_points": 1000,
                },
            )

            if created:
                _send_welcome_email(user)

            return success(
                {
                    "tokens": tokens_for_user(user),
                    "user": ShopperSerializer(user).data,
                    "created": created,
                }
            )
        except Exception as exc:
            import logging
            logging.getLogger(__name__).exception("Google login error: %s", exc)
            from common.exceptions import AppError
            msg = str(exc) if str(exc) else "Google Sign-In verification failed."
            raise AppError(msg, code="GOOGLE_LOGIN_FAILED")


class LoginOTPRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginOTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return success(OTPVerificationService().request_login_otp(
            email=serializer.validated_data["email"], role=User.ROLE_SHOPPER
        ))


class LoginOTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginOTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = OTPVerificationService().verify_login_otp(
            email=serializer.validated_data["email"],
            role=User.ROLE_SHOPPER,
            challenge_id=serializer.validated_data.get("challenge_id"),
            code=serializer.validated_data["code"],
        )
        return success({"tokens": tokens_for_user(user), "user": ShopperSerializer(user).data})


class ForgotPasswordRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = OTPVerificationService().request_password_reset_otp(
            email=serializer.validated_data["email"]
        )
        return success(result)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        OTPVerificationService().reset_password(
            email=serializer.validated_data["email"],
            code=serializer.validated_data["code"],
            new_password=serializer.validated_data["new_password"],
            challenge_id=serializer.validated_data.get("challenge_id"),
        )
        return success({"reset": True})


class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            from common.exceptions import AppError

            raise AppError("Refresh token is required.", code="REFRESH_REQUIRED")
        try:
            refresh = RefreshToken(refresh_token)
            return success({"access": str(refresh.access_token)})
        except Exception:
            from common.exceptions import AppError

            raise AppError("Refresh token is invalid or expired.", code="REFRESH_INVALID")


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except Exception:
                pass
        return success(None)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success(ShopperSerializer(request.user).data)

    def patch(self, request):
        user = request.user
        allowed = {"name", "phone"}
        for field, value in request.data.items():
            if field in allowed:
                setattr(user, field, value)
        user.save()
        return success(ShopperSerializer(user).data)


class AddressListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, "shopper_profile", None)
        if profile is None:
            return success([])
        return success(AddressSerializer(profile.addresses.all(), many=True).data)

    def post(self, request):
        profile = getattr(request.user, "shopper_profile", None)
        if profile is None:
            from common.exceptions import AppError

            raise AppError("Shopper profile required.", code="SHOPPER_PROFILE_REQUIRED")
        serializer = AddressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(shopper=profile)
        return success(serializer.data, status=status.HTTP_201_CREATED)


class AddressDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        address = Address.objects.filter(shopper__user=request.user, pk=pk).first()
        if address is None:
            raise NotFoundError("Address not found.")
        address.delete()
        profile = getattr(request.user, "shopper_profile", None)
        return success(
            AddressSerializer(profile.addresses.all(), many=True).data if profile else []
        )
