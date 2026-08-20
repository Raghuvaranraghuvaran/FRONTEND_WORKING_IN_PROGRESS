from django.contrib.auth import authenticate, get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from common.exceptions import AppError
from common.permissions import IsMerchantAdmin
from common.response import success
from common.tenancy import get_merchant_from_user
from accounts.services import tokens_for_user
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
        email = request.data.get("email")
        password = request.data.get("password")
        user = authenticate(request, email=email, password=password)
        if user is None or not user.is_merchant_admin:
            raise AppError("Invalid merchant credentials.", code="INVALID_CREDENTIALS")
        merchant = get_merchant_from_user(user)
        return success(
            {
                "tokens": tokens_for_user(user),
                "admin": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "role": user.role,
                },
                "merchant": MerchantSerializer(merchant).data,
            }
        )
