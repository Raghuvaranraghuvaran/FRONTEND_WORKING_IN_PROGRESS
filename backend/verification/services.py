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
    RESET_PURPOSE = "password_reset"

    def request_login_otp(self, *, email, role):
        clean_email = (email or "").strip().lower()
        if not clean_email:
            raise AppError("Email is required.", code="EMAIL_REQUIRED")

        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.filter(email__iexact=clean_email).first()
        if user is None and role == User.ROLE_MERCHANT_ADMIN:
            user = User.objects.filter(merchant_username__iexact=clean_email).first()

        if user is None:
            if role == User.ROLE_MERCHANT_ADMIN:
                raise AppError("No merchant account found for this email/username. Please register your store first.", code="ACCOUNT_NOT_FOUND")
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

        # Relaxed rate limiting in dev/debug (50 requests/10min), 20 in prod
        max_requests = 50 if getattr(settings, "DEBUG", False) else 20
        window_start = timezone.now() - timedelta(seconds=self.LOGIN_WINDOW_SECONDS)
        recent_requests = OTPChallenge.objects.filter(
            user=user,
            purpose=self.LOGIN_PURPOSE,
            created_at__gte=window_start,
        ).count()
        if recent_requests >= max_requests:
            raise AppError("Too many OTP requests. Please wait a couple minutes or use demo code 123456.", code="OTP_RATE_LIMITED")

        code = f"{secrets.randbelow(1000000):06d}"
        now = timezone.now()
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
        print(f"[ReturnGuard OTP] Role: {role}")
        print("==========================================\n")

        from common.mailer import send_async_email
        html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your ReturnGuard Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 30px 15px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 28px 24px; text-align: center;">
                            <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff;">ReturnGuard Security</h1>
                            <p style="margin: 4px 0 0; font-size: 13px; color: #e0e7ff;">Account Verification Code</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 28px 24px; text-align: center;">
                            <p style="margin: 0 0 16px; font-size: 15px; color: #334155;">
                                Hi <strong>{user.name or 'there'}</strong>,
                            </p>
                            <p style="margin: 0 0 24px; font-size: 14px; color: #64748b; line-height: 1.5;">
                                Use the 6-digit verification code below to sign in to your ReturnGuard account:
                            </p>
                            <div style="background-color: #eef2ff; border: 2px dashed #6366f1; border-radius: 12px; padding: 18px 24px; display: inline-block; margin: 0 auto 20px;">
                                <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; font-family: monospace;">{code}</span>
                            </div>
                            <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                                ⏱️ This code is valid for <strong>5 minutes</strong> and can only be used once.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8fafc; padding: 18px 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">
                                If you did not request this verification code, you can safely ignore this email.<br>
                                © ReturnGuard · E-Commerce Return & Fraud Protection
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""

        text_body = f"Hi {user.name or 'there'},\n\nYour ReturnGuard sign-in verification code is: {code}\n\nThis code expires in 5 minutes.\n\nThank you,\nReturnGuard Team"

        send_async_email(
            subject=f"Your ReturnGuard verification code: {code}",
            message=text_body,
            html_message=html_body,
            recipient_list=[user.email],
            from_name="ReturnGuard Security",
        )

        VerificationEvent.objects.create(customer=user, method=self.LOGIN_METHOD, status="sent")
        return {
            "sent": True,
            "challenge_id": challenge.id,
            "expires_in": self.TTL_SECONDS,
        }

    def verify_login_otp(self, *, email, role, challenge_id, code):
        clean_email = (email or "").strip().lower()
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.filter(email__iexact=clean_email).first()
        if user is None and role == User.ROLE_MERCHANT_ADMIN:
            user = User.objects.filter(merchant_username__iexact=clean_email).first()

        if user is None:
            raise AppError("No account found for this email.", code="ACCOUNT_NOT_FOUND")

        demo_match = code == getattr(settings, "DEMO_OTP", "123456")
        now = timezone.now()

        # Step 1: Look up challenge by ID if provided
        challenge = None
        if challenge_id:
            challenge = OTPChallenge.objects.filter(
                user=user,
                id=challenge_id,
                purpose=self.LOGIN_PURPOSE,
                verified_at__isnull=True,
                expires_at__gt=now,
            ).first()

        # Step 2: If challenge by ID not found or expired, look up by matching code hash across all active challenges for user
        if challenge is None:
            code_hash = self._hash_code(code)
            challenge = OTPChallenge.objects.filter(
                user=user,
                purpose=self.LOGIN_PURPOSE,
                verified_at__isnull=True,
                expires_at__gt=now,
                code_hash=code_hash,
            ).first()

        # Step 3: If demo OTP used, find the latest active challenge for user
        if challenge is None and demo_match:
            challenge = OTPChallenge.objects.filter(
                user=user,
                purpose=self.LOGIN_PURPOSE,
                verified_at__isnull=True,
                expires_at__gt=now,
            ).order_by("-created_at").first()

        if challenge is None and not demo_match:
            raise AppError("Invalid or expired sign-in code. Please check your email or enter demo code 123456.", code="OTP_INVALID")

        if challenge:
            if challenge.attempts >= self.MAX_ATTEMPTS:
                raise AppError("Too many attempts. Request a new code.", code="OTP_ATTEMPTS_EXCEEDED")
            challenge.attempts += 1
            challenge.save(update_fields=["attempts", "updated_at"])
            code_matches = secrets.compare_digest(self._hash_code(code), challenge.code_hash) or demo_match
            if not code_matches:
                VerificationEvent.objects.create(customer=user, method=self.LOGIN_METHOD, status="failed")
                raise AppError("Invalid sign-in code. Please check your email or enter 123456.", code="OTP_INVALID")
            challenge.verified_at = timezone.now()
            challenge.save(update_fields=["verified_at", "updated_at"])

        VerificationEvent.objects.create(customer=user, method=self.LOGIN_METHOD, status="confirmed", confidence=1)
        return user

    def request_password_reset_otp(self, *, email):
        clean_email = (email or "").strip().lower()
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.filter(email__iexact=clean_email).first()
        if user is None:
            # Do not reveal whether the email exists; return a generic sent response.
            return {"sent": True, "expires_in": self.TTL_SECONDS}

        code = f"{secrets.randbelow(1000000):06d}"
        now = timezone.now()
        challenge = OTPChallenge.objects.create(
            user=user,
            target=user.email,
            method=self.LOGIN_METHOD,
            purpose=self.RESET_PURPOSE,
            role=user.role,
            code_hash=self._hash_code(code),
            expires_at=now + timedelta(seconds=self.TTL_SECONDS),
        )

        print("\n==========================================")
        print(f"[ReturnGuard Password Reset] Email: {user.email}")
        print(f"[ReturnGuard Password Reset] Code: {code}")
        print("==========================================\n")

        from common.mailer import send_async_email
        send_async_email(
            subject=f"Your ReturnGuard password reset code: {code}",
            message=(
                f"Hi {user.name or 'there'},\n\n"
                f"Your ReturnGuard password reset code is: {code}\n\n"
                "This code expires in 5 minutes. If you did not request this, "
                "you can safely ignore this email.\n\n"
                "— ReturnGuard Security Team"
            ),
            recipient_list=[user.email],
            from_name="ReturnGuard Security",
        )

        res = {"sent": True, "challenge_id": challenge.id, "expires_in": self.TTL_SECONDS}
        if getattr(settings, "DEBUG", False):
            res["debug_code"] = code
        return res

    def reset_password(self, *, email, code, new_password, challenge_id=None):
        clean_email = (email or "").strip().lower()
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.filter(email__iexact=clean_email).first()
        if user is None:
            raise AppError("No account found for this email.", code="ACCOUNT_NOT_FOUND")

        demo_match = code == getattr(settings, "DEMO_OTP", "123456")
        now = timezone.now()

        challenge = None
        if challenge_id:
            challenge = OTPChallenge.objects.filter(
                user=user,
                id=challenge_id,
                purpose=self.RESET_PURPOSE,
                verified_at__isnull=True,
                expires_at__gt=now,
            ).first()

        if challenge is None:
            code_hash = self._hash_code(code)
            challenge = OTPChallenge.objects.filter(
                user=user,
                purpose=self.RESET_PURPOSE,
                verified_at__isnull=True,
                expires_at__gt=now,
                code_hash=code_hash,
            ).first()

        if challenge is None and demo_match:
            challenge = OTPChallenge.objects.filter(
                user=user,
                purpose=self.RESET_PURPOSE,
                verified_at__isnull=True,
                expires_at__gt=now,
            ).order_by("-created_at").first()

        if challenge is None and not demo_match:
            raise AppError("Invalid or expired reset code. Please request a new one.", code="OTP_INVALID")

        if challenge:
            if challenge.attempts >= self.MAX_ATTEMPTS:
                raise AppError("Too many attempts. Request a new code.", code="OTP_ATTEMPTS_EXCEEDED")
            challenge.attempts += 1
            challenge.save(update_fields=["attempts", "updated_at"])
            code_matches = secrets.compare_digest(self._hash_code(code), challenge.code_hash) or demo_match
            if not code_matches:
                raise AppError("Invalid reset code. Please check your email or enter 123456.", code="OTP_INVALID")
            challenge.verified_at = timezone.now()
            challenge.save(update_fields=["verified_at", "updated_at"])

        user.set_password(new_password)
        user.save(update_fields=["password"])
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
        code = f"{secrets.randbelow(1000000):06d}"
        target_dest = target or getattr(user, "phone", "") or getattr(user, "email", "")
        challenge = OTPChallenge.objects.create(
            user=user,
            target=target_dest,
            method=method,
            purpose="verification",
            code_hash=self._hash_code(code),
            expires_at=timezone.now() + timedelta(seconds=self.TTL_SECONDS),
        )
        VerificationEvent.objects.create(
            customer=user, method=method, status="sent", confidence=0
        )
        
        recipient_email = target if ("@" in (target or "")) else getattr(user, "email", None)
        if recipient_email:
            from common.mailer import send_async_email
            send_async_email(
                subject=f"Your ReturnGuard Verification Code: {code}",
                message=f"Hello {user.name or 'there'},\n\nYour ReturnGuard verification code is: {code}\n\nThis code expires in 5 minutes.\n\n— ReturnGuard Security Team",
                recipient_list=[recipient_email],
                from_name="ReturnGuard Security",
            )
        print(f"[ReturnGuard OTP] Sent {code} to {target_dest}")
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

        demo_match = code == getattr(settings, "DEMO_OTP", "123456")
        if challenge is None:
            challenge = OTPChallenge.objects.filter(
                user=user,
                purpose="verification",
                verified_at__isnull=True,
                expires_at__gt=timezone.now(),
            ).order_by("-created_at").first()

        # Lenient demo path
        if challenge is None and demo_match:
            VerificationEvent.objects.create(
                customer=user, method="sms_otp", status="confirmed", confidence=0.7
            )
            self._apply_to_return(user, return_id)
            return {"verified": True}

        if challenge is None and not demo_match:
            raise AppError("OTP challenge is invalid or expired.", code="OTP_INVALID")

        if challenge:
            if challenge.attempts >= self.MAX_ATTEMPTS:
                raise AppError("Too many attempts. Request a new OTP.", code="OTP_ATTEMPTS_EXCEEDED")

            challenge.attempts += 1
            challenge.save(update_fields=["attempts"])

            code_matches = secrets.compare_digest(self._hash_code(code), challenge.code_hash) or demo_match
            if not code_matches:
                VerificationEvent.objects.create(
                    customer=user, method=challenge.method, status="failed", confidence=0
                )
                raise AppError("Invalid OTP code.", code="OTP_INVALID")

            challenge.verified_at = timezone.now()
            challenge.save(update_fields=["verified_at"])

        VerificationEvent.objects.create(
            customer=user, method="otp", status="confirmed", confidence=0.7
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
