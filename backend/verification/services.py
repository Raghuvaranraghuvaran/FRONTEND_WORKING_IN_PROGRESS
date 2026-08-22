import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from common.exceptions import AppError
from .models import OTPChallenge, VerificationEvent


class OTPVerificationService:
    MAX_ATTEMPTS = 5
    TTL_SECONDS = 300
    LOGIN_METHOD = "email_otp"
    LOGIN_PURPOSE = "login"
    LOGIN_WINDOW_SECONDS = 600
    LOGIN_MAX_REQUESTS = 10

    def request_login_otp(self, *, email, role):
        clean_email = (email or "").strip().lower()
        if not clean_email:
            raise AppError("Email is required.", code="EMAIL_REQUIRED")

        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.filter(email__iexact=clean_email).first()
        if user is None:
            if role == User.ROLE_MERCHANT_ADMIN:
                raise AppError("No merchant account found for this email. Please register your store first.", code="ACCOUNT_NOT_FOUND")
            # Auto-provision new shopper account for passwordless sign-in
            name = clean_email.split("@")[0].title()
            user = User.objects.create_user(
                email=clean_email,
                name=name,
                role=User.ROLE_SHOPPER,
            )
            from accounts.models import ShopperProfile
            ShopperProfile.objects.get_or_create(
                user=user,
                defaults={"customer_id": f"CUST-{user.id + 1000}"}
            )

        window_start = timezone.now() - timedelta(seconds=self.LOGIN_WINDOW_SECONDS)
        recent_requests = OTPChallenge.objects.filter(
            user=user,
            purpose=self.LOGIN_PURPOSE,
            created_at__gte=window_start,
        ).count()
        if recent_requests >= self.LOGIN_MAX_REQUESTS:
            raise AppError("Too many OTP requests. Try again in 10 minutes.", code="OTP_RATE_LIMITED")

        code = f"{secrets.randbelow(1000000):06d}"
        now = timezone.now()
        OTPChallenge.objects.filter(
            user=user,
            purpose=self.LOGIN_PURPOSE,
            verified_at__isnull=True,
        ).update(expires_at=now)
        challenge = OTPChallenge.objects.create(
            user=user,
            target=user.email,
            method=self.LOGIN_METHOD,
            purpose=self.LOGIN_PURPOSE,
            role=role,
            code_hash=self._hash_code(code),
            expires_at=now + timedelta(seconds=self.TTL_SECONDS),
        )

        print("\n==========================================")
        print(f"[ReturnGuard OTP] Email: {user.email}")
        print(f"[ReturnGuard OTP] Code: {code}")
        print("==========================================\n")

        from common.mailer import send_async_email
        send_async_email(
            subject="Your ReturnGuard sign-in code",
            message=f"Your ReturnGuard sign-in code is {code}. It expires in 5 minutes.\n\nThank you,\nReturnGuard Team",
            recipient_list=[user.email],
        )

        VerificationEvent.objects.create(customer=user, method=self.LOGIN_METHOD, status="sent")
        return {
            "sent": True,
            "challenge_id": challenge.id,
            "expires_in": self.TTL_SECONDS,
            "code": code,
        }

    def verify_login_otp(self, *, email, role, challenge_id, code):
        clean_email = (email or "").strip().lower()
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.filter(email__iexact=clean_email).first()
        if user is None:
            raise AppError("No account found for this email.", code="ACCOUNT_NOT_FOUND")

        challenge = OTPChallenge.objects.filter(
            user=user,
            id=challenge_id,
            purpose=self.LOGIN_PURPOSE,
            verified_at__isnull=True,
            expires_at__gt=timezone.now(),
        ).first() if challenge_id else None

        # Accept valid challenge hash OR global demo code 123456
        demo_match = code == getattr(settings, "DEMO_OTP", "123456")
        if challenge is None and not demo_match:
            # Check most recent active challenge
            challenge = OTPChallenge.objects.filter(
                user=user,
                purpose=self.LOGIN_PURPOSE,
                verified_at__isnull=True,
                expires_at__gt=timezone.now(),
            ).order_by("-created_at").first()

        if challenge is None and not demo_match:
            raise AppError("Invalid or expired sign-in code.", code="OTP_INVALID")

        if challenge:
            if challenge.attempts >= self.MAX_ATTEMPTS:
                raise AppError("Too many attempts. Request a new code.", code="OTP_ATTEMPTS_EXCEEDED")
            challenge.attempts += 1
            challenge.save(update_fields=["attempts", "updated_at"])
            code_matches = secrets.compare_digest(self._hash_code(code), challenge.code_hash) or demo_match
            if not code_matches:
                VerificationEvent.objects.create(customer=user, method=self.LOGIN_METHOD, status="failed")
                raise AppError("Invalid or expired sign-in code.", code="OTP_INVALID")
            challenge.verified_at = timezone.now()
            challenge.save(update_fields=["verified_at", "updated_at"])

        VerificationEvent.objects.create(customer=user, method=self.LOGIN_METHOD, status="confirmed", confidence=1)
        return user

    def _get_existing_user(self, email, role):
        from django.contrib.auth import get_user_model

        User = get_user_model()
        user = User.objects.filter(email__iexact=email.strip()).first()
        if user is None:
            raise AppError(
                "No account found with this email. Please create an account first.",
                code="ACCOUNT_NOT_FOUND"
            )
        if role and user.role != role:
            user.role = role
            user.save(update_fields=["role"])
        return user


    def send_otp(self, *, user, method="sms_otp", target=""):
        code = settings.DEMO_OTP
        challenge = OTPChallenge.objects.create(
            user=user,
            target=target or user.phone,
            method=method,
            purpose="verification",
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
        pepper = getattr(settings, "OTP_PEPPER", "")
        return hashlib.sha256(f"{pepper}:{code}".encode()).hexdigest()
