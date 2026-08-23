import logging
import smtplib
import ssl
from concurrent.futures import ThreadPoolExecutor
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, send_mail

logger = logging.getLogger(__name__)

# Global persistent thread pool executor
_EMAIL_EXECUTOR = ThreadPoolExecutor(max_workers=4, thread_name_prefix="rg_mailer")

SMTP_USER = getattr(settings, "EMAIL_HOST_USER", "infiniteganesforu@gmail.com")
SMTP_PASS = getattr(settings, "EMAIL_HOST_PASSWORD", "kzgzqywjqocxjorv")
DEFAULT_FROM_NAME = "ReturnGuard Security"


def _send_direct_smtp(subject, message, recipient, from_name=DEFAULT_FROM_NAME, from_addr=SMTP_USER, html_message=None):
    """
    Directly sends a dual-mode (HTML + Plain Text) email via Gmail SMTP_SSL (Port 465) with TLS (Port 587) fallback.
    """
    if html_message:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = formataddr((from_name, from_addr))
        msg["To"] = recipient
        msg.attach(MIMEText(message, "plain", "utf-8"))
        msg.attach(MIMEText(html_message, "html", "utf-8"))
    else:
        msg = MIMEText(message, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = formataddr((from_name, from_addr))
        msg["To"] = recipient

    # Strategy 1: SMTPS / SSL over Port 465 (most reliable)
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context, timeout=15) as server:
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(from_addr, [recipient], msg.as_string())
        print(f"[Email Dispatch] SUCCESS: Delivered '{subject}' to {recipient} via Gmail SSL (Port 465)!", flush=True)
        return True
    except Exception as err_ssl:
        print(f"[Email Dispatch] Port 465 SSL failed ({err_ssl}), attempting Port 587 TLS fallback...", flush=True)

    # Strategy 2: STARTTLS over Port 587
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=15) as server:
            server.starttls(context=context)
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(from_addr, [recipient], msg.as_string())
        print(f"[Email Dispatch] SUCCESS: Delivered '{subject}' to {recipient} via Gmail TLS (Port 587)!", flush=True)
        return True
    except Exception as err_tls:
        print(f"[Email Dispatch] Port 587 TLS failed ({err_tls}), attempting Django backend fallback...", flush=True)

    # Strategy 3: Standard Django EmailMultiAlternatives fallback
    try:
        if html_message:
            django_msg = EmailMultiAlternatives(
                subject=subject,
                body=message,
                from_email=formataddr((from_name, from_addr)),
                to=[recipient],
            )
            django_msg.attach_alternative(html_message, "text/html")
            django_msg.send(fail_silently=False)
        else:
            send_mail(
                subject=subject,
                message=message,
                from_email=formataddr((from_name, from_addr)),
                recipient_list=[recipient],
                fail_silently=False,
            )
        print(f"[Email Dispatch] SUCCESS: Delivered '{subject}' to {recipient} via Django backend!", flush=True)
        return True
    except Exception as err_django:
        logger.error("All email delivery methods failed for %s: %s", recipient, err_django, exc_info=True)
        print(f"[Email Dispatch ERROR] All email delivery attempts failed for {recipient}: {err_django}", flush=True)
        return False


def _dispatch_task(subject, message, recipient, from_name, from_addr, html_message):
    _send_direct_smtp(subject, message, recipient, from_name, from_addr, html_message)


def send_async_email(subject, message, recipient_list, from_name=DEFAULT_FROM_NAME, from_addr=None, html_message=None):
    """
    Submits email tasks to persistent thread pool for guaranteed asynchronous delivery.
    Supports both plain text and rich HTML templates.
    """
    sender = from_addr or SMTP_USER
    recipients = [r.strip() for r in recipient_list if r and r.strip()]
    for recipient in recipients:
        _EMAIL_EXECUTOR.submit(_dispatch_task, subject, message, recipient, from_name, sender, html_message)
