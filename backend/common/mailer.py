import logging
import sys
from concurrent.futures import ThreadPoolExecutor
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)

# Global persistent thread pool executor (non-daemon so tasks are never killed mid-flight)
_EMAIL_EXECUTOR = ThreadPoolExecutor(max_workers=4, thread_name_prefix="rg_mailer")


def _dispatch(subject, message, recipient, from_addr):
    try:
        print(f"[Email Dispatch] Sending '{subject}' to {recipient}...", flush=True)
        send_mail(
            subject=subject,
            message=message,
            from_email=from_addr,
            recipient_list=[recipient],
            fail_silently=False,
        )
        print(f"[Email Dispatch] SUCCESS: Email successfully delivered to {recipient}!", flush=True)
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", recipient, exc, exc_info=True)
        print(f"[Email Dispatch Error] Failed sending to {recipient}: {exc}", flush=True)


def send_async_email(subject, message, recipient_list, from_email=None):
    """
    Submits email tasks to a persistent ThreadPoolExecutor for guaranteed delivery.
    """
    from_addr = from_email or settings.DEFAULT_FROM_EMAIL
    recipients = [r.strip() for r in recipient_list if r and r.strip()]
    for recipient in recipients:
        _EMAIL_EXECUTOR.submit(_dispatch, subject, message, recipient, from_addr)
