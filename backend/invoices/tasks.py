"""
Celery tasks for invoice generation and rich HTML email delivery
"""
import io
import logging
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from email.utils import formataddr
from decimal import Decimal

from celery import shared_task
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone

logger = logging.getLogger(__name__)

SMTP_USER = getattr(settings, "EMAIL_HOST_USER", "")
SMTP_PASS = getattr(settings, "EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_NAME = "ReturnGuard"


def dispatch_order_invoice_async(order_id):
    """
    Safely dispatches PDF invoice generation and rich HTML email with PDF attachment in background thread.
    Guarantees non-blocking execution so checkout never hangs or buffers.
    """
    def _execute():
        from orders.models import Order
        from invoices.models import Invoice
        from invoices.pdf_generator import InvoicePDFGenerator

        try:
            order = Order.objects.select_related('user', 'merchant').prefetch_related('items', 'items__product').filter(id=order_id).first()
            if not order:
                return

            payment = getattr(order, 'payment', None)
            invoice, _ = Invoice.objects.get_or_create(
                order=order,
                defaults={
                    "invoice_number": Invoice.generate_number(order),
                    "status": "generated"
                }
            )

            # Generate PDF if not yet present
            pdf_bytes = None
            pdf_filename = f"Invoice-{invoice.invoice_number}.pdf"
            try:
                if not invoice.pdf_file:
                    generator = InvoicePDFGenerator(order, invoice)
                    pdf_content = generator.generate()
                    invoice.pdf_file.save(pdf_filename, ContentFile(pdf_content), save=True)
                    pdf_bytes = pdf_content
                else:
                    with invoice.pdf_file.open('rb') as f:
                        pdf_bytes = f.read()
            except Exception as pdf_err:
                logger.warning(f"PDF generation note for invoice {invoice.invoice_number}: {pdf_err}")

            customer = order.user
            merchant = order.merchant
            payment_method = _safe_display(payment, 'payment_method') if payment else (order.payment_method or 'Cash on Delivery (COD)')
            payment_status = _safe_display(payment, 'status') if payment else 'Confirmed'
            transaction_id = getattr(payment, 'transaction_id', '') or getattr(payment, 'gateway_payment_id', '') if payment else ''

            subject = f"Order Confirmed & Invoice - {order.order_number}"
            html_content = _build_html_email(order, invoice, customer, merchant, payment_method, payment_status, transaction_id)
            text_content = _build_plain_text_email(order, invoice, customer, merchant, payment_method, payment_status, transaction_id)

            dest_email = (getattr(customer, "email", None) or getattr(order, "customer_email", None) or "").strip()
            if dest_email:
                recipients = [dest_email]
            else:
                recipients = []

            if recipients:
                from common.mailer import send_async_email
                send_async_email(
                    subject=subject,
                    message=text_content,
                    html_message=html_content,
                    recipient_list=recipients,
                    from_name=getattr(merchant, "business_name", None) or DEFAULT_FROM_NAME,
                    pdf_bytes=pdf_bytes,
                    pdf_filename=pdf_filename,
                )

            invoice.email_status = 'sent'
            invoice.email_sent_at = timezone.now()
            invoice.save(update_fields=['email_status', 'email_sent_at'])
            print(f"[Order Invoice] SUCCESS: Dispatched invoice email for Order #{order.order_number} to {dest_email} (PDF attachment included)", flush=True)

        except Exception as exc:
            logger.exception("Failed to dispatch invoice for order %s: %s", order_id, exc)
            print(f"[Order Invoice] FAILED for order #{order_id}: {exc}. Scheduling Celery retry...", flush=True)
            try:
                from invoices.tasks import generate_and_send_invoice
                generate_and_send_invoice.delay(order_id)
            except Exception as retry_err:
                logger.warning(f"Could not schedule Celery retry for order {order_id}: {retry_err}")

    import threading
    t = threading.Thread(target=_execute, daemon=True, name=f"invoice_order_{order_id}")
    t.start()


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def generate_and_send_invoice(self, order_id):
    """
    Generate PDF invoice and send it to customer's registered email.
    Uses the Django database as the single source of truth for all invoice data.
    """
    dispatch_order_invoice_async(order_id)
    return {'success': True, 'order_id': order_id}


@shared_task(bind=True, max_retries=5, default_retry_delay=300)
def send_invoice_email_task(self, invoice_id):
    """
    Send rich HTML invoice email to customer's registered email with PDF attachment.
    """
    from invoices.models import Invoice

    try:
        invoice = Invoice.objects.select_related(
            'order__user', 'order__merchant'
        ).get(id=invoice_id)

        order = invoice.order
        customer = order.user
        merchant = order.merchant

        payment = None
        try:
            payment = order.payment
        except Exception:
            pass

        # Update attempt count
        invoice.email_attempts += 1
        invoice.email_last_attempt_at = timezone.now()
        invoice.save(update_fields=['email_attempts', 'email_last_attempt_at'])

        # Prepare details
        payment_method = _safe_display(payment, 'payment_method') if payment else (order.payment_method or 'Cash on Delivery (COD)')
        payment_status = _safe_display(payment, 'status') if payment else 'Pending'
        transaction_id = getattr(payment, 'transaction_id', '') or getattr(payment, 'gateway_payment_id', '') if payment else ''

        # Read PDF binary
        pdf_bytes = None
        if invoice.pdf_file:
            try:
                with invoice.pdf_file.open('rb') as pdf:
                    pdf_bytes = pdf.read()
            except Exception as read_err:
                logger.warning(f"Could not read PDF file for invoice {invoice.invoice_number}: {read_err}")

        # Build Rich HTML and Plain Text Bodies
        subject = f"Order Confirmed & Invoice - {order.order_number}"
        html_content = _build_html_email(order, invoice, customer, merchant, payment_method, payment_status, transaction_id)
        text_content = _build_plain_text_email(order, invoice, customer, merchant, payment_method, payment_status, transaction_id)

        # Dispatch Email (Strategy 1: Django EmailMultiAlternatives with Fallback to Direct SMTP SSL)
        email_sent = False
        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=formataddr((merchant.business_name or DEFAULT_FROM_NAME, settings.DEFAULT_FROM_EMAIL or SMTP_USER)),
                to=[customer.email],
                reply_to=[merchant.admin_email],
            )
            msg.attach_alternative(html_content, "text/html")
            if pdf_bytes:
                msg.attach(f"Invoice-{invoice.invoice_number}.pdf", pdf_bytes, "application/pdf")

            msg.send(fail_silently=False)
            email_sent = True
        except Exception as django_err:
            logger.warning(f"Django EmailMultiAlternatives failed ({django_err}), falling back to direct SMTP with PDF...")
            email_sent = _send_direct_smtp_invoice(
                subject=subject,
                text_content=text_content,
                html_content=html_content,
                recipient=customer.email,
                pdf_bytes=pdf_bytes,
                pdf_filename=f"Invoice-{invoice.invoice_number}.pdf",
                from_name=merchant.business_name or DEFAULT_FROM_NAME,
            )

        if not email_sent:
            raise RuntimeError("Email delivery failed across all available mail dispatchers")

        # Update invoice record
        invoice.email_status = 'sent'
        invoice.email_sent_at = timezone.now()
        invoice.email_last_error = ''
        invoice.status = 'sent'
        invoice.save(update_fields=['email_status', 'email_sent_at', 'email_last_error', 'status'])

        logger.info(f"Rich invoice email successfully delivered to {customer.email}")
        return {'success': True, 'invoice_number': invoice.invoice_number, 'sent_to': customer.email}

    except Invoice.DoesNotExist:
        logger.error(f"Invoice {invoice_id} not found")
        return {'success': False, 'error': 'Invoice not found'}

    except Exception as exc:
        error_msg = str(exc)
        logger.error(f"Error sending invoice email for invoice {invoice_id}: {error_msg}")
        try:
            invoice = Invoice.objects.get(id=invoice_id)
            invoice.email_status = 'failed'
            invoice.email_last_error = error_msg[:500]
            invoice.save(update_fields=['email_status', 'email_last_error'])
        except Exception:
            pass

        retry_delay = min(120 * (2 ** self.request.retries), 3600)
        try:
            raise self.retry(exc=exc, countdown=retry_delay)
        except Exception:
            pass  # Max retries exhausted


def _build_html_email(order, invoice, customer, merchant, payment_method, payment_status, transaction_id):
    """Build a professional, modern HTML email template with web-safe typography and rich cards."""
    items = list(order.items.all())
    item_rows = ""
    for item in items:
        unit_price = Decimal(str(item.price))
        total_price = unit_price * item.quantity
        item_rows += f"""
        <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px 0; font-size: 14px; color: #1e293b; font-weight: 500;">
                {item.name}
            </td>
            <td style="padding: 12px 0; font-size: 14px; color: #64748b; text-align: center;">
                {item.quantity}
            </td>
            <td style="padding: 12px 0; font-size: 14px; color: #1e293b; text-align: right; font-weight: 600; font-family: monospace;">
                Rs. {total_price:,.2f}
            </td>
        </tr>
        """

    # Discount rows
    discount_rows = ""
    if order.discount and order.discount > 0:
        code_tag = f" <span style='font-size:11px; background:#f3e8ff; color:#7e22ce; padding:2px 6px; border-radius:4px; font-weight:bold;'>{order.coupon_code}</span>" if order.coupon_code else ""
        discount_rows += f"""
        <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #16a34a;">Coupon Discount{code_tag}:</td>
            <td style="padding: 6px 0; font-size: 13px; color: #16a34a; text-align: right; font-weight: 600; font-family: monospace;">-Rs. {order.discount:,.2f}</td>
        </tr>
        """
    reward_discount = getattr(order, 'reward_discount', 0) or 0
    if reward_discount and reward_discount > 0:
        pts = getattr(order, 'reward_points_used', 0) or 0
        discount_rows += f"""
        <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #d97706;">Reward Points Redeemed ({pts} pts):</td>
            <td style="padding: 6px 0; font-size: 13px; color: #d97706; text-align: right; font-weight: 600; font-family: monospace;">-Rs. {reward_discount:,.2f}</td>
        </tr>
        """

    # Payment note
    payment_badge = f"""
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; margin-top: 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td style="font-size: 13px; color: #64748b;">Payment Method:</td>
                <td style="font-size: 13px; color: #1e293b; font-weight: 700; text-align: right;">{payment_method}</td>
            </tr>
            <tr>
                <td style="font-size: 13px; color: #64748b; padding-top: 4px;">Payment Status:</td>
                <td style="font-size: 13px; color: #16a34a; font-weight: 700; text-align: right; padding-top: 4px;">{payment_status}</td>
            </tr>
            {f'<tr><td style="font-size: 12px; color: #b45309; padding-top: 4px; font-weight: 600;">Reward Points Earned:</td><td style="font-size: 12px; color: #b45309; font-weight: 700; text-align: right; padding-top: 4px;">+{order.reward_points_earned} pts</td></tr>' if getattr(order, 'reward_points_earned', 0) else ''}
            {f'<tr><td style="font-size: 12px; color: #64748b; padding-top: 4px;">Transaction ID:</td><td style="font-size: 12px; color: #1e293b; font-family: monospace; text-align: right; padding-top: 4px;">{transaction_id}</td></tr>' if transaction_id else ''}
        </table>
    </div>
    """

    order_date_str = order.created_at.strftime('%d %b %Y, %I:%M %p') if order.created_at else ''
    delivery_addr = str(order.delivery_address or 'Standard registered shipping address')

    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - {order.order_number}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 30px 15px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
                    
                    <!-- Header Banner -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px 30px; text-align: center;">
                            <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); width: 48px; height: 48px; line-height: 48px; border-radius: 50%; font-size: 24px; color: #ffffff; margin-bottom: 12px;">✓</div>
                            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">Order Confirmed!</h1>
                            <p style="margin: 6px 0 0; font-size: 14px; color: #e0e7ff;">Thank you for shopping with {merchant.business_name}</p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 28px 30px;">
                            <p style="margin: 0 0 16px; font-size: 15px; color: #334155; line-height: 1.5;">
                                Hi <strong>{customer.name or 'Valued Customer'}</strong>,<br>
                                We've received your order! Below is your order summary and official tax invoice details.
                            </p>

                            <!-- Order Meta Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
                                <tr>
                                    <td style="font-size: 12px; color: #64748b; padding-bottom: 4px;">Order Number</td>
                                    <td style="font-size: 12px; color: #64748b; text-align: right; padding-bottom: 4px;">Invoice Number</td>
                                </tr>
                                <tr>
                                    <td style="font-size: 15px; font-weight: 800; color: #0f172a; font-family: monospace;">{order.order_number}</td>
                                    <td style="font-size: 15px; font-weight: 800; color: #4f46e5; text-align: right; font-family: monospace;">{invoice.invoice_number}</td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="font-size: 12px; color: #64748b; padding-top: 8px; border-top: 1px solid #e2e8f0; margin-top: 8px;">
                                        Order Date & Time: <strong style="color: #334155;">{order_date_str}</strong>
                                    </td>
                                </tr>
                            </table>

                            <!-- Items Table -->
                            <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">Items Ordered</h3>
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                                <thead>
                                    <tr style="border-bottom: 2px solid #e2e8f0;">
                                        <th style="padding: 8px 0; font-size: 11px; font-weight: 700; color: #64748b; text-align: left; text-transform: uppercase;">Product</th>
                                        <th style="padding: 8px 0; font-size: 11px; font-weight: 700; color: #64748b; text-align: center; text-transform: uppercase;">Qty</th>
                                        <th style="padding: 8px 0; font-size: 11px; font-weight: 700; color: #64748b; text-align: right; text-transform: uppercase;">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {item_rows}
                                </tbody>
                            </table>

                            <!-- Order Totals Card -->
                            <div style="background-color: #faf5ff; border: 1px solid #f3e8ff; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Subtotal:</td>
                                        <td style="padding: 4px 0; font-size: 13px; color: #1e293b; text-align: right; font-weight: 600; font-family: monospace;">Rs. {order.subtotal:,.2f}</td>
                                    </tr>
                                    {discount_rows}
                                    <tr>
                                        <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Delivery Fee:</td>
                                        <td style="padding: 4px 0; font-size: 13px; color: #16a34a; text-align: right; font-weight: 700;">FREE</td>
                                    </tr>
                                    <tr style="border-top: 1.5px solid #e9d5ff;">
                                        <td style="padding-top: 10px; font-size: 16px; font-weight: 800; color: #4f46e5;">Grand Total:</td>
                                        <td style="padding-top: 10px; font-size: 18px; font-weight: 800; color: #4f46e5; text-align: right; font-family: monospace;">Rs. {order.total:,.2f}</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Payment Information -->
                            {payment_badge}

                            <!-- PDF Attachment Callout -->
                            <div style="background: #eef2ff; border: 1px dashed #6366f1; border-radius: 12px; padding: 14px 16px; margin-top: 20px; text-align: center;">
                                <span style="font-size: 20px;">📎</span>
                                <p style="margin: 4px 0 0; font-size: 13px; font-weight: 700; color: #4338ca;">
                                    Official Tax Invoice PDF Attached
                                </p>
                                <p style="margin: 2px 0 0; font-size: 12px; color: #6366f1;">
                                    You can find your itemized PDF invoice attached to this email.
                                </p>
                            </div>

                            <!-- Delivery Address -->
                            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
                                <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em;">Shipping Destination</p>
                                <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.4;">{delivery_addr}</p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 24px 30px; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="margin: 0; font-size: 13px; font-weight: 700; color: #334155;">{merchant.business_name}</p>
                            <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">
                                Contact Support: <a href="mailto:{merchant.admin_email}" style="color: #4f46e5; text-decoration: none; font-weight: 600;">{merchant.admin_email}</a>
                            </p>
                            <p style="margin: 12px 0 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">
                                This is an automated email from ReturnGuard. Please do not reply directly to this message.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    return html


def _build_plain_text_email(order, invoice, customer, merchant, payment_method, payment_status, transaction_id):
    """Clean plain-text email fallback."""
    items = list(order.items.all())
    product_lines = [f"  * {it.name} (Qty: {it.quantity}) - Rs. {it.price:,.2f}" for it in items]
    product_summary = "\n".join(product_lines) if product_lines else "  (No items)"

    discount_info = ""
    if order.discount and order.discount > 0:
        discount_info += f"\nCoupon Discount: -Rs. {order.discount:,.2f} ({order.coupon_code or 'Applied'})"
    reward_discount = getattr(order, 'reward_discount', 0) or 0
    if reward_discount and reward_discount > 0:
        discount_info += f"\nReward Points: -Rs. {reward_discount:,.2f}"

    date_str = order.created_at.strftime('%d %b %Y, %I:%M %p') if order.created_at else ''

    return f"""Dear {customer.name or 'Valued Customer'},

Thank you for your order! Your order has been placed successfully with {merchant.business_name}.

ORDER DETAILS:
Order Number:   {order.order_number}
Invoice Number: {invoice.invoice_number}
Order Date:     {date_str}

PRODUCTS ORDERED:
{product_summary}

PAYMENT & TOTALS:
Payment Method: {payment_method}
Payment Status: {payment_status}
{f'Transaction ID: {transaction_id}' if transaction_id else ''}
Subtotal:       Rs. {order.subtotal:,.2f}{discount_info}
Grand Total:    Rs. {order.total:,.2f}

ATTACHED INVOICE:
Your complete, itemized tax invoice is attached as a PDF (Invoice-{invoice.invoice_number}.pdf).

For any queries, please contact: {merchant.admin_email}

Best regards,
{merchant.business_name}
"""


def _send_direct_smtp_invoice(subject, text_content, html_content, recipient, pdf_bytes=None, pdf_filename="Invoice.pdf", from_name=DEFAULT_FROM_NAME, from_addr=SMTP_USER):
    """Direct SMTP sender with Resend HTTPS API and SMTP fallback support."""
    try:
        from common.mailer import send_email_sync
        return send_email_sync(
            subject=subject,
            message=text_content,
            recipient_list=[recipient],
            from_name=from_name,
            from_addr=from_addr,
            html_message=html_content,
            pdf_bytes=pdf_bytes,
            pdf_filename=pdf_filename,
        )
    except Exception as exc:
        print(f"[Invoice Mailer] Email dispatch failed: {exc}", flush=True)
        return False


def _safe_display(obj, field_name):
    """Safely get display value for a choice field."""
    display_method = f"get_{field_name}_display"
    if hasattr(obj, display_method):
        try:
            return getattr(obj, display_method)()
        except Exception:
            pass
    return str(getattr(obj, field_name, 'N/A'))
