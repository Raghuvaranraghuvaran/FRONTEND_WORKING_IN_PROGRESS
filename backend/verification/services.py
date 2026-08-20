import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from common.exceptions import AppError
from .models import OTPChallenge, VerificationEvent


class OTPVerificationService:
    MAX_ATTEMPTS = 5
    TTL_SECONDS = 300

    def send_otp(self, *, user, method="sms_otp", target=""):
        code = settings.DEMO_OTP
        challenge = OTPChallenge.objects.create(
            user=user,
            target=target or user.phone,
            method=method,
            code_hash=self._hash_code(code),
            expires_at=timezone.now() + timedelta(seconds=self.TTL_SECONDS),
        )
        VerificationEvent.objects.create(
            customer=user, method=method, status="sent", confidence=0
        )
        # A real SMS provider integration belongs here.
        return {"challenge_id": challenge.id, "expires_in": self.TTL_SECONDS, "demo": True}

    def verify_otp(self, *, user, challenge_id=None, code, return_id=None):
        challenge = None
        if challenge_id:
            challenge = OTPChallenge.objects.filter(
                user=user,
                id=challenge_id,
                verified_at__isnull=True,
                expires_at__gt=timezone.now(),
            ).order_by("-created_at").first()

        # Lenient demo path: the frontend checkout OTP flow does not call
        # /send/ first, so accept the demo code without a persisted challenge.
        if challenge is None and code == settings.DEMO_OTP:
            VerificationEvent.objects.create(
                customer=user, method="sms_otp", status="confirmed", confidence=0.7
            )
            self._apply_to_return(user, return_id)
            return {"verified": True}

        if challenge is None:
            raise AppError("OTP challenge is invalid or expired.", code="OTP_INVALID")

        if challenge.attempts >= self.MAX_ATTEMPTS:
            raise AppError("Too many attempts. Request a new OTP.", code="OTP_ATTEMPTS_EXCEEDED")

        challenge.attempts += 1
        challenge.save(update_fields=["attempts"])

        if not secrets.compare_digest(self._hash_code(code), challenge.code_hash):
            VerificationEvent.objects.create(
                customer=user, method=challenge.method, status="failed", confidence=0
            )
            raise AppError("Invalid OTP. For demo, use 123456.", code="OTP_INVALID")

        challenge.verified_at = timezone.now()
        challenge.save(update_fields=["verified_at"])

        VerificationEvent.objects.create(
            customer=user, method=challenge.method, status="confirmed", confidence=0.7
        )

        self._apply_to_return(user, return_id)
        return {"verified": True}

    def _apply_to_return(self, user, return_id):
        if not return_id:
            return
        from returns.models import ReturnEvent, ReturnRequest

        return_request = ReturnRequest.objects.filter(user=user, id=return_id).first()
        if return_request is None:
            return
        return_request.verification_status = "Verified"
        return_request.verification_method = "sms_otp"
        return_request.status = "manual_review" if return_request.risk_tier == "High" else "approved"
        return_request.outcome = "pending_review" if return_request.risk_tier == "High" else "auto_approved"
        return_request.risk_score = max(5, return_request.risk_score - 15)
        return_request.save()
        ReturnEvent.objects.create(return_request=return_request, label="OTP verified")

    def _hash_code(self, code):
        return hashlib.sha256(code.encode()).hexdigest()
