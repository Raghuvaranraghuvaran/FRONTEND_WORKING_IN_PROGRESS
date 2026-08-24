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

DEFAULT_FROM_NAME = "ReturnGuard Security"


def _get_smtp_credentials():
    user = getattr(settings, "EMAIL_HOST_USER", "infiniteganesforu@gmail.com")
    password = getattr(settings, "EMAIL_HOST_PASSWORD", "kzgzqywjqocxjorv")
    host = getattr(settings, "EMAIL_HOST", "smtp.gmail.com")
    return user, password, host


def _send_direct_smtp(subject, message, recipient, from_name=DEFAULT_FROM_NAME, from_addr=None, html_message=None, pdf_bytes=None, pdf_filename="Invoice.pdf"):
    """
    Directly sends a dual-mode (HTML + Plain Text) email with optional PDF attachment
    via Gmail SMTP_SSL (Port 465) with TLS (Port 587) and Django mailer fallback.
    """
    from email.mime.application import MIMEApplication
    smtp_user, smtp_pass, smtp_host = _get_smtp_credentials()
    effective_from = from_addr or smtp_user

    if pdf_bytes or html_message:
        msg = MIMEMultipart("mixed")
        msg["Subject"] = subject
        msg["From"] = formataddr((from_name, effective_from))
        msg["To"] = recipient
        msg["Reply-To"] = effective_from
        msg["Auto-Submitted"] = "auto-generated"
        msg["X-Auto-Response-Suppress"] = "All"

        alt_part = MIMEMultipart("alternative")
        alt_part.attach(MIMEText(message, "plain", "utf-8"))
        if html_message:
            alt_part.attach(MIMEText(html_message, "html", "utf-8"))
        msg.attach(alt_part)

        if pdf_bytes:
            pdf_attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
            pdf_attachment.add_header('Content-Disposition', 'attachment', filename=pdf_filename)
            msg.attach(pdf_attachment)
    else:
        msg = MIMEText(message, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = formataddr((from_name, effective_from))
        msg["To"] = recipient
        msg["Reply-To"] = effective_from
        msg["Auto-Submitted"] = "auto-generated"
        msg["X-Auto-Response-Suppress"] = "All"

    # Strategy 1: SMTPS / SSL over Port 465 (most reliable)
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(smtp_host, 465, context=context, timeout=8) as server:
            server.login(smtp_user, smtp_pass)
            server.sendmail(effective_from, [recipient], msg.as_string())
        print(f"[Email Dispatch] SUCCESS: Delivered '{subject}' to {recipient} via {smtp_host} SSL (Port 465) (PDF attached: {bool(pdf_bytes)})!", flush=True)
        return True
    except Exception as err_ssl:
        print(f"[Email Dispatch] Port 465 SSL failed ({err_ssl}), attempting Port 587 TLS fallback...", flush=True)

    # Strategy 2: STARTTLS over Port 587
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, 587, timeout=8) as server:
            server.starttls(context=context)
            server.login(smtp_user, smtp_pass)
            server.sendmail(effective_from, [recipient], msg.as_string())
        print(f"[Email Dispatch] SUCCESS: Delivered '{subject}' to {recipient} via {smtp_host} TLS (Port 587) (PDF attached: {bool(pdf_bytes)})!", flush=True)
        return True
    except Exception as err_tls:
        print(f"[Email Dispatch] Port 587 TLS failed ({err_tls}), attempting Django backend fallback...", flush=True)

    # Strategy 3: Standard Django EmailMultiAlternatives fallback
    try:
        django_msg = EmailMultiAlternatives(
            subject=subject,
            body=message,
            from_email=formataddr((from_name, effective_from)),
            to=[recipient],
        )
        if html_message:
            django_msg.attach_alternative(html_message, "text/html")
        if pdf_bytes:
            django_msg.attach(pdf_filename, pdf_bytes, "application/pdf")
        django_msg.send(fail_silently=False)
        print(f"[Email Dispatch] SUCCESS: Delivered '{subject}' to {recipient} via Django backend!", flush=True)
        return True
    except Exception as err_django:
        logger.error("All email delivery methods failed for %s: %s", recipient, err_django, exc_info=True)
        print(f"[Email Dispatch ERROR] All email delivery attempts failed for {recipient}: {err_django}", flush=True)
        return False


def _dispatch_task(subject, message, recipient, from_name, from_addr, html_message, pdf_bytes, pdf_filename):
    try:
        _send_direct_smtp(subject, message, recipient, from_name, from_addr, html_message, pdf_bytes, pdf_filename)
    except Exception as exc:
        logger.exception("Background email dispatch failed for %s: %s", recipient, exc)
        print(f"[Email Dispatch ERROR] Failed to deliver '{subject}' to {recipient}: {exc}", flush=True)


import threading

def send_async_email(subject, message, recipient_list, from_name=DEFAULT_FROM_NAME, from_addr=None, html_message=None, pdf_bytes=None, pdf_filename="Invoice.pdf"):
    """
    Spawns background daemon thread for guaranteed asynchronous delivery.
    Supports plain text, rich HTML templates, and PDF attachments.
    Never blocks the caller and never fails on executor shutdown.
    """
    smtp_user, _, _ = _get_smtp_credentials()
    sender = from_addr or smtp_user
    recipients = [r.strip() for r in recipient_list if r and r.strip()]
    for recipient in recipients:
        t = threading.Thread(
            target=_dispatch_task,
            args=(subject, message, recipient, from_name, sender, html_message, pdf_bytes, pdf_filename),
            daemon=True,
            name=f"email_{recipient[:10]}"
        )
        t.start()
