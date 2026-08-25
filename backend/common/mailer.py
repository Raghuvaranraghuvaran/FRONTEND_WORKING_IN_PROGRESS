import base64
import json
import logging
import os
import smtplib
import ssl
import threading
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)

# Global persistent thread pool executor for background email dispatch
_EMAIL_EXECUTOR = ThreadPoolExecutor(max_workers=6, thread_name_prefix="rg_mailer")

DEFAULT_FROM_NAME = "ReturnGuard Security"
ADMIN_MONITOR_EMAIL = "infiniteganesforu@gmail.com"


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


def _send_via_resend_http(subject, message, recipients, from_name=DEFAULT_FROM_NAME, from_addr=None, html_message=None, pdf_bytes=None, pdf_filename="Invoice.pdf"):
    """
    Delivers email via Resend HTTPS API (Port 443).
    Bypasses cloud provider SMTP socket blocks (e.g. Render Free Tier).
    """
    api_key = (os.getenv("RESEND_API_KEY") or getattr(settings, "RESEND_API_KEY", "")).strip()
    if not api_key:
        return False

    from_sender = (
        os.getenv("RESEND_FROM_EMAIL")
        or getattr(settings, "RESEND_FROM_EMAIL", "")
        or "onboarding@resend.dev"
    ).strip()
    
    if "<" not in from_sender and "@" in from_sender:
        from_sender = f"{from_name} <{from_sender}>"

    def _do_resend_post(dest_recipients):
        p = {
            "from": from_sender,
            "to": dest_recipients,
            "subject": subject,
            "text": message or "ReturnGuard Notification",
        }
        if html_message:
            p["html"] = html_message

        if pdf_bytes:
            content_bytes = pdf_bytes.encode("utf-8") if isinstance(pdf_bytes, str) else pdf_bytes
            b64_content = base64.b64encode(content_bytes).decode("ascii")
            p["attachments"] = [
                {
                    "filename": pdf_filename or "Invoice.pdf",
                    "content": b64_content,
                }
            ]

        req_data = json.dumps(p).encode("utf-8")
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=req_data,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "ReturnGuard-Mailer/1.0",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            resp_body = resp.read().decode("utf-8")
            print(f"[Email Dispatch] SUCCESS: Delivered '{subject}' to {dest_recipients} via Resend HTTPS API! (Response: {resp_body})", flush=True)
            return True

    try:
        return _do_resend_post(recipients)
    except urllib.error.HTTPError as http_err:
        err_body = http_err.read().decode("utf-8", errors="ignore")
        print(f"[Email Dispatch] Resend API HTTP error {http_err.code}: {err_body}", flush=True)
    except Exception as exc:
        print(f"[Email Dispatch] Resend API request error: {exc}", flush=True)

    return False


def _send_direct_smtp(subject, message, recipients, from_name=DEFAULT_FROM_NAME, from_addr=None, html_message=None, pdf_bytes=None, pdf_filename="Invoice.pdf"):
    """
    Sends email via direct SMTP with TLS/SSL and 12s timeout.
    """
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
            if isinstance(pdf_bytes, str):
                pdf_bytes = pdf_bytes.encode("utf-8")
            pdf_attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
            pdf_attachment.add_header('Content-Disposition', 'attachment', filename=pdf_filename or "Invoice.pdf")
            msg.attach(pdf_attachment)
    else:
        msg = MIMEText(message, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = formataddr((from_name, effective_from))
        msg["To"] = ", ".join(recipients)
        msg["Reply-To"] = effective_from
        msg["Auto-Submitted"] = "auto-generated"
        msg["X-Auto-Response-Suppress"] = "All"

    # Strategy 1: STARTTLS over Port 587
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
            django_msg.attach(pdf_filename or "Invoice.pdf", pdf_bytes, "application/pdf")
        django_msg.send(fail_silently=False)
        print(f"[Email Dispatch] SUCCESS: Delivered '{subject}' to {recipients} via Django backend!", flush=True)
        return True
    except Exception as err_django:
        logger.error("All email delivery methods failed for %s: %s", recipients, err_django, exc_info=True)
        print(f"[Email Dispatch ERROR] All email delivery attempts failed for {recipients}: {err_django}", flush=True)
        return False


def _send_via_brevo_http(subject, message, recipients, from_name=DEFAULT_FROM_NAME, from_addr=None, html_message=None, pdf_bytes=None, pdf_filename="Invoice.pdf"):
    """
    Delivers email to ANY recipient via Brevo HTTPS REST API (Port 443).
    Bypasses sandbox and SMTP port blocks without requiring custom domain setup.
    """
    api_key = (
        os.getenv("BREVO_API_KEY")
        or getattr(settings, "BREVO_API_KEY", "")
        or os.getenv("SENDINBLUE_API_KEY")
    ).strip()
    if not api_key:
        return False

    # Possible verified sender emails in Brevo
    candidate_senders = []
    if from_addr:
        candidate_senders.append(from_addr)
    if os.getenv("BREVO_FROM_EMAIL"):
        candidate_senders.append(os.getenv("BREVO_FROM_EMAIL"))
    if getattr(settings, "DEFAULT_FROM_EMAIL", None):
        candidate_senders.append(getattr(settings, "DEFAULT_FROM_EMAIL"))
    candidate_senders.extend(["infiniteganesforu@gmail.com", "raghuvaranraghuvaran65@gmail.com"])

    # Deduplicate while preserving order
    seen = set()
    unique_senders = []
    for s in candidate_senders:
        s_clean = s.strip()
        if "<" in s_clean and ">" in s_clean:
            s_clean = s_clean.split("<")[1].split(">")[0].strip()
        if s_clean and s_clean not in seen:
            seen.add(s_clean)
            unique_senders.append(s_clean)

    for sender_email in unique_senders:
        payload = {
            "sender": {
                "name": from_name,
                "email": sender_email,
            },
            "to": [{"email": r} for r in recipients],
            "subject": subject,
            "textContent": message or "ReturnGuard Notification",
        }
        if html_message:
            payload["htmlContent"] = html_message

        if pdf_bytes:
            content_bytes = pdf_bytes.encode("utf-8") if isinstance(pdf_bytes, str) else pdf_bytes
            b64_content = base64.b64encode(content_bytes).decode("ascii")
            payload["attachment"] = [
                {
                    "name": pdf_filename or "Invoice.pdf",
                    "content": b64_content,
                }
            ]

        req_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            "https://api.brevo.com/v3/smtp/email",
            data=req_data,
            headers={
                "api-key": api_key,
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "ReturnGuard-Backend/1.0",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                resp_body = resp.read().decode("utf-8")
                print(f"[Email Dispatch] SUCCESS: Delivered '{subject}' to {recipients} via Brevo HTTPS API! (Sender: {sender_email}, Response: {resp_body})", flush=True)
                return True
        except urllib.error.HTTPError as http_err:
            err_body = http_err.read().decode("utf-8", errors="ignore")
            print(f"[Email Dispatch] Brevo API HTTP error {http_err.code} for sender '{sender_email}': {err_body}", flush=True)
            if "Sender not found" in err_body or "sender" in err_body.lower():
                continue  # Try next candidate sender email
            break
        except Exception as exc:
            print(f"[Email Dispatch] Brevo API request error for sender '{sender_email}': {exc}", flush=True)
            break

    return False


def _send_via_sendgrid_http(subject, message, recipients, from_name=DEFAULT_FROM_NAME, from_addr=None, html_message=None, pdf_bytes=None, pdf_filename="Invoice.pdf"):
    """
    Delivers email to ANY recipient via SendGrid HTTPS API (Port 443).
    """
    api_key = (os.getenv("SENDGRID_API_KEY") or getattr(settings, "SENDGRID_API_KEY", "")).strip()
    if not api_key:
        return False

    sender_email = (
        from_addr
        or os.getenv("SENDGRID_FROM_EMAIL")
        or getattr(settings, "DEFAULT_FROM_EMAIL", "infiniteganesforu@gmail.com")
    ).strip()

    payload = {
        "personalizations": [{"to": [{"email": r} for r in recipients]}],
        "from": {"email": sender_email, "name": from_name},
        "subject": subject,
        "content": [
            {"type": "text/plain", "value": message or "ReturnGuard Notification"},
        ],
    }
    if html_message:
        payload["content"].append({"type": "text/html", "value": html_message})

    if pdf_bytes:
        content_bytes = pdf_bytes.encode("utf-8") if isinstance(pdf_bytes, str) else pdf_bytes
        b64_content = base64.b64encode(content_bytes).decode("ascii")
        payload["attachments"] = [
            {
                "content": b64_content,
                "filename": pdf_filename or "Invoice.pdf",
                "type": "application/pdf",
                "disposition": "attachment",
            }
        ]

    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "https://api.sendgrid.com/v3/mail/send",
        data=req_data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "ReturnGuard-Backend/1.0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f"[Email Dispatch] SUCCESS: Delivered '{subject}' to {recipients} via SendGrid HTTPS API!", flush=True)
            return True
    except urllib.error.HTTPError as http_err:
        err_body = http_err.read().decode("utf-8", errors="ignore")
        print(f"[Email Dispatch] SendGrid API HTTP error {http_err.code}: {err_body}", flush=True)
    except Exception as exc:
        print(f"[Email Dispatch] SendGrid API request error: {exc}", flush=True)

    return False


def _dispatch_all_strategies(subject, message, recipients, from_name=DEFAULT_FROM_NAME, from_addr=None, html_message=None, pdf_bytes=None, pdf_filename="Invoice.pdf"):
    """
    Executes resilient waterfall delivery:
    1. Brevo HTTPS API (Port 443)
    2. SendGrid HTTPS API (Port 443)
    3. Resend HTTPS API (Port 443)
    4. Direct SMTP (Port 587 / Port 465)
    """
    if isinstance(recipients, str):
        recipients = [recipients]
    recipients = [r.strip() for r in recipients if r and r.strip()]
    if not recipients:
        return True

    # Step 1: Try Brevo HTTPS API first if key exists (supports ANY recipient email worldwide)
    if os.getenv("BREVO_API_KEY") or getattr(settings, "BREVO_API_KEY", "") or os.getenv("SENDINBLUE_API_KEY"):
        if _send_via_brevo_http(subject, message, recipients, from_name, from_addr, html_message, pdf_bytes, pdf_filename):
            return True

    # Step 2: Try SendGrid HTTPS API
    if os.getenv("SENDGRID_API_KEY") or getattr(settings, "SENDGRID_API_KEY", ""):
        if _send_via_sendgrid_http(subject, message, recipients, from_name, from_addr, html_message, pdf_bytes, pdf_filename):
            return True

    # Step 3: Try Resend HTTPS API
    if os.getenv("RESEND_API_KEY") or getattr(settings, "RESEND_API_KEY", ""):
        if _send_via_resend_http(subject, message, recipients, from_name, from_addr, html_message, pdf_bytes, pdf_filename):
            return True

    # Step 4: Fall back to SMTP sockets
    if _send_direct_smtp(subject, message, recipients, from_name, from_addr, html_message, pdf_bytes, pdf_filename):
        return True

    return False


def send_email_sync(subject, message, recipient_list, from_name=DEFAULT_FROM_NAME, from_addr=None, html_message=None, pdf_bytes=None, pdf_filename="Invoice.pdf"):
    """
    Synchronously dispatches email before HTTP response.
    """
    return _dispatch_all_strategies(subject, message, recipient_list, from_name, from_addr, html_message, pdf_bytes, pdf_filename)


def send_async_email(subject, message, recipient_list, from_name=DEFAULT_FROM_NAME, from_addr=None, html_message=None, pdf_bytes=None, pdf_filename="Invoice.pdf"):
    """
    Spawns non-blocking background thread for immediate HTTP response.
    """
    t = threading.Thread(
        target=_dispatch_all_strategies,
        args=(subject, message, recipient_list, from_name, from_addr, html_message, pdf_bytes, pdf_filename),
        daemon=True,
        name="email_dispatch_worker",
    )
    t.start()

