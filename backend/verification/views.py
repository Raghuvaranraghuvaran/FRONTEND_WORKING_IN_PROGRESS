from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from common.response import success
from .serializers import SendOTPSerializer, VerifyOTPSerializer
from .services import OTPVerificationService


class SendOTPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = OTPVerificationService().send_otp(
            user=request.user,
            method=serializer.validated_data.get("method", "sms_otp"),
            target=serializer.validated_data.get("target", ""),
        )
        return success(result)


class VerifyOTPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = OTPVerificationService().verify_otp(
            user=request.user,
            challenge_id=serializer.validated_data.get("challenge_id") or None,
            code=serializer.validated_data["code"],
            return_id=serializer.validated_data.get("return_id") or None,
        )
        return success(result)
