"""
Celery tasks for invoice generation and email delivery
"""
import logging
from datetime import datetime

from celery import shared_task
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.mail import EmailMessage
from django.db import transaction
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def generate_and_send_invoice(self, order_id):
    """
    Generate PDF invoice and send it to customer's email
    
    This is the main task that combines PDF generation and email delivery.
    Uses transaction.on_commit pattern to ensure order is committed before processing.
    """
    from orders.models import Order
    from invoices.models import Invoice
    from invoices.pdf_generator import InvoicePDFGenerator
    
    try:
        # Get order with related data
        order = Order.objects.select_related(
            'user', 'merchant', 'payment'
        ).prefetch_related('items').get(id=order_id)
        
        # Check if invoice already exists
        invoice = getattr(order, 'invoice', None)
        
        if not invoice:
            # Create invoice record
            invoice = Invoice.objects.create(
                order=order,
                invoice_number=Invoice.generate_number(order),
                status='generated'
            )
        
        # Generate PDF if not already generated
        if not invoice.pdf_file:
            logger.info(f"Generating PDF for invoice {invoice.invoice_number}")
            
            generator = InvoicePDFGenerator(order, invoice)
            pdf_content = generator.generate()
            
            # Save PDF file
            filename = f"{invoice.invoice_number}.pdf"
            invoice.pdf_file.save(filename, ContentFile(pdf_content), save=True)
            
            logger.info(f"PDF generated successfully: {filename}")
        
        # Send email
        send_invoice_email_task.delay(invoice.id)
        
        return {
            'success': True,
            'invoice_id': invoice.id,
            'invoice_number': invoice.invoice_number
        }
        
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found")
        return {'success': False, 'error': 'Order not found'}
        
    except Exception as exc:
        logger.error(f"Error generating invoice for order {order_id}: {exc}")
        # Retry with exponential backoff
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=5, default_retry_delay=300)
def send_invoice_email_task(self, invoice_id):
    """
    Send invoice email to customer with PDF attachment
    
    This task handles email delivery with automatic retries for transient failures.
    It updates the invoice record with email delivery status.
    """
    from invoices.models import Invoice
    
    try:
        invoice = Invoice.objects.select_related(
            'order__user', 'order__merchant', 'order__payment'
        ).get(id=invoice_id)
        
        order = invoice.order
        customer = order.user
        merchant = order.merchant
        payment = order.payment
        
        # Update attempt count
        invoice.email_attempts += 1
        invoice.email_last_attempt_at = timezone.now()
        invoice.save(update_fields=['email_attempts', 'email_last_attempt_at'])
        
        # Prepare email
        subject = f"Order Confirmation & Invoice - {order.order_number}"
        
        # Email body
        payment_status = payment.get_status_display() if payment else 'Pending'
        payment_method = payment.get_payment_method_display() if payment else 'N/A'
        
        message = f"""
Dear {customer.name},

Thank you for your order!

Order Details:
--------------
Order Number: {order.order_number}
Invoice Number: {invoice.invoice_number}
Order Date: {order.created_at.strftime('%B %d, %Y at %I:%M %p')}
Total Amount: ₹{order.total:,.2f}

Payment Information:
-------------------
Payment Method: {payment_method}
Payment Status: {payment_status}
"""
        
        if payment and payment.payment_method == 'COD':
            message += "\nNote: Payment will be collected upon delivery.\n"
        elif payment and payment.transaction_id:
            message += f"Transaction ID: {payment.transaction_id}\n"
        
        message += f"""
Your invoice is attached to this email for your records.

You can also download your invoice anytime from:
My Orders > View Order > Download Invoice

Thank you for shopping with {merchant.business_name}!

Best regards,
{merchant.business_name}
{merchant.admin_email}

---
This is an automated email. Please do not reply.
For support, contact: {merchant.admin_email}
"""
        
        # Create email
        email = EmailMessage(
            subject=subject,
            body=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[customer.email],
            reply_to=[merchant.admin_email],
        )
        
        # Attach PDF
        if invoice.pdf_file:
            with invoice.pdf_file.open('rb') as pdf:
                email.attach(
                    f"{invoice.invoice_number}.pdf",
                    pdf.read(),
                    'application/pdf'
                )
        
        # Send email
        email.send(fail_silently=False)
        
        # Update invoice status
        invoice.email_status = 'sent'
        invoice.email_sent_at = timezone.now()
        invoice.email_last_error = ''
        invoice.status = 'sent'
        invoice.save(update_fields=[
            'email_status', 'email_sent_at', 'email_last_error', 'status'
        ])
        
        logger.info(f"Invoice email sent successfully to {customer.email}")
        
        return {
            'success': True,
            'invoice_number': invoice.invoice_number,
            'sent_to': customer.email
        }
        
    except Invoice.DoesNotExist:
        logger.error(f"Invoice {invoice_id} not found")
        return {'success': False, 'error': 'Invoice not found'}
        
    except Exception as exc:
        error_msg = str(exc)
        logger.error(f"Error sending invoice email for invoice {invoice_id}: {error_msg}")
        
        # Update invoice with error
        try:
            invoice = Invoice.objects.get(id=invoice_id)
            invoice.email_status = 'failed'
            invoice.email_last_error = error_msg[:500]  # Limit error message length
            invoice.save(update_fields=['email_status', 'email_last_error'])
        except:
            pass
        
        # Retry with exponential backoff (60s, 300s, 900s, 1800s, 3600s)
        retry_delay = min(60 * (5 ** self.request.retries), 3600)
        raise self.retry(exc=exc, countdown=retry_delay)


@shared_task
def retry_failed_invoice_emails():
    """
    Periodic task to retry failed invoice emails
    
    Can be scheduled via Celery Beat to run every hour
    """
    from invoices.models import Invoice
    from django.utils import timezone
    from datetime import timedelta
    
    # Find invoices with failed emails that haven't been retried recently
    one_hour_ago = timezone.now() - timedelta(hours=1)
    
    failed_invoices = Invoice.objects.filter(
        email_status='failed',
        email_attempts__lt=5,  # Max 5 attempts
        email_last_attempt_at__lt=one_hour_ago
    )
    
    count = 0
    for invoice in failed_invoices:
        send_invoice_email_task.delay(invoice.id)
        count += 1
    
    logger.info(f"Queued {count} failed invoice emails for retry")
    return {'retried': count}
