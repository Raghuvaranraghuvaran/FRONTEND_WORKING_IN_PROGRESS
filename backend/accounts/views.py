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
    GoogleLoginSerializer,
    LoginSerializer,
    RegisterSerializer,
    ShopperSerializer,
)
from .services import tokens_for_user

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
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
        if user is None:
            from common.exceptions import AppError

            raise AppError("Invalid email or password.", code="INVALID_CREDENTIALS")
        return success({"tokens": tokens_for_user(user), "user": ShopperSerializer(user).data})


class GoogleLoginView(APIView):
    """Exchange a Google Identity Services credential for our JWT."""

    permission_classes = [AllowAny]

    def post(self, request):
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
            ShopperProfile.objects.create(
                user=user,
                customer_id=f"CUST-{user.id + 1000}",
            )

        return success(
            {
                "tokens": tokens_for_user(user),
                "user": ShopperSerializer(user).data,
                "created": created,
            }
        )


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
