from rest_framework import serializers


class SendOTPSerializer(serializers.Serializer):
    method = serializers.CharField(default="sms_otp")
    target = serializers.CharField(required=False, allow_blank=True, default="")


class VerifyOTPSerializer(serializers.Serializer):
    challenge_id = serializers.CharField(required=False, allow_blank=True, default="")
    code = serializers.CharField()
    return_id = serializers.CharField(required=False, allow_blank=True, default="")
