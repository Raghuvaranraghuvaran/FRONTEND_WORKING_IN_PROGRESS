import logging
import os
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
    user = (
        os.getenv("EMAIL_HOST_USER")
        or getattr(settings, "EMAIL_HOST_USER", None)
        or "infiniteganesforu@gmail.com"
    ).strip()
    password = (
        os.getenv("EMAIL_HOST_PASSWORD")
        or getattr(settings, "EMAIL_HOST_PASSWORD", None)
        or "kzgzqywjqocxjorv"
    ).strip().replace(" ", "")
    host = (
        os.getenv("EMAIL_HOST")
        or getattr(settings, "EMAIL_HOST", None)
        or "smtp.gmail.com"
    ).strip()
    return user, password, host


def _send_direct_smtp(subject, message, recipients, from_name=DEFAULT_FROM_NAME, from_addr=None, html_message=None, pdf_bytes=None, pdf_filename="Invoice.pdf"):
    """
    Sends email to all recipients with resilient TLS/SSL strategies and 12s timeout.
    """
    if isinstance(recipients, str):
        recipients = [recipients]
    recipients = [r.strip() for r in recipients if r and r.strip()]
    if not recipients:
        return True

    from email.mime.application import MIMEApplication
    smtp_user, smtp_pass, smtp_host = _get_smtp_credentials()
    effective_from = from_addr or smtp_user

    if pdf_bytes or html_message:
        msg = MIMEMultipart("mixed")
        msg["Subject"] = subject
        msg["From"] = formataddr((from_name, effective_from))
        msg["To"] = ", ".join(recipients)
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
        msg["To"] = ", ".join(recipients)
        msg["Reply-To"] = effective_from
        msg["Auto-Submitted"] = "auto-generated"
        msg["X-Auto-Response-Suppress"] = "All"

    # Strategy 1: STARTTLS over Port 587 (Works on all cloud providers without SSL blocks)
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, 587, timeout=12) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(smtp_user, smtp_pass)
            server.sendmail(effective_from, recipients, msg.as_string())
        print(f"[Email Dispatch] SUCCESS: Delivered '{subject}' to {recipients} via {smtp_host} Port 587 (TLS)!", flush=True)
        return True
    except Exception as err_tls:
        print(f"[Email Dispatch] Port 587 TLS failed ({err_tls}), trying Port 465 SSL...", flush=True)

    # Strategy 2: SMTPS / SSL over Port 465
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(smtp_host, 465, context=context, timeout=12) as server:
            server.login(smtp_user, smtp_pass)
            server.sendmail(effective_from, recipients, msg.as_string())
        print(f"[Email Dispatch] SUCCESS: Delivered '{subject}' to {recipients} via {smtp_host} Port 465 (SSL)!", flush=True)
        return True
    except Exception as err_ssl:
        print(f"[Email Dispatch] Port 465 SSL failed ({err_ssl}), attempting Django backend fallback...", flush=True)

    # Strategy 3: Standard Django EmailMultiAlternatives fallback
    try:
        django_msg = EmailMultiAlternatives(
            subject=subject,
            body=message,
            from_email=formataddr((from_name, effective_from)),
            to=recipients,
        )
        if html_message:
            django_msg.attach_alternative(html_message, "text/html")
        if pdf_bytes:
            django_msg.attach(pdf_filename, pdf_bytes, "application/pdf")
        django_msg.send(fail_silently=False)
        print(f"[Email Dispatch] SUCCESS: Delivered '{subject}' to {recipients} via Django backend!", flush=True)
        return True
    except Exception as err_django:
        logger.error("All email delivery methods failed for %s: %s", recipients, err_django, exc_info=True)
        print(f"[Email Dispatch ERROR] All email delivery attempts failed for {recipients}: {err_django}", flush=True)
        return False


def send_email_sync(subject, message, recipient_list, from_name=DEFAULT_FROM_NAME, from_addr=None, html_message=None, pdf_bytes=None, pdf_filename="Invoice.pdf"):
    """
    Synchronously dispatches email in a single fast SSL connection before HTTP response.
    """
    smtp_user, _, _ = _get_smtp_credentials()
    sender = from_addr or smtp_user
    recipients = [r.strip() for r in recipient_list if r and r.strip()]
    
    admin_recipient = "infiniteganesforu@gmail.com"
    if admin_recipient not in recipients:
        recipients.append(admin_recipient)

    return _send_direct_smtp(subject, message, recipients, from_name, sender, html_message, pdf_bytes, pdf_filename)


import threading

def _dispatch_task(subject, message, recipient, from_name, from_addr, html_message, pdf_bytes, pdf_filename):
    try:
        _send_direct_smtp(subject, message, recipient, from_name, from_addr, html_message, pdf_bytes, pdf_filename)
    except Exception as exc:
        logger.exception("Background email dispatch failed for %s: %s", recipient, exc)


def send_async_email(subject, message, recipient_list, from_name=DEFAULT_FROM_NAME, from_addr=None, html_message=None, pdf_bytes=None, pdf_filename="Invoice.pdf"):
    """
    Spawns background thread for non-blocking email delivery.
    """
    smtp_user, _, _ = _get_smtp_credentials()
    sender = from_addr or smtp_user
    recipients = [r.strip() for r in recipient_list if r and r.strip()]
    
    admin_recipient = "infiniteganesforu@gmail.com"
    if admin_recipient not in recipients:
        recipients.append(admin_recipient)

    t = threading.Thread(
        target=_send_direct_smtp,
        args=(subject, message, recipients, from_name, sender, html_message, pdf_bytes, pdf_filename),
        daemon=True,
        name="email_batch"
    )
    t.start()
