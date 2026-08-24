"""
Payment Service with Demo Payment Providers

This service provides a clean abstraction for processing payments.
The DemoPaymentProvider can be easily replaced with real payment gateway providers later.
"""
import logging
import random
import uuid
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from .models import Payment, PaymentEvent

logger = logging.getLogger(__name__)


class PaymentService:
    """
    Main payment service that delegates to payment providers
    
    This service acts as the interface between the application and payment providers.
    It handles payment creation, processing, and status updates in a provider-agnostic way.
    """
    
    def __init__(self, provider=None):
        self.provider = provider or DemoPaymentProvider()
    
    @transaction.atomic
    def create_payment(self, order, payment_method, payment_details=None):
        """
        Create a new payment record
        
        Args:
            order: Order instance
            payment_method: Payment method choice (COD, UPI, CREDIT_CARD, etc.)
            payment_details: Optional dict with payment method specific data
        
        Returns:
            Payment instance
        """
        payment = Payment.objects.create(
            order=order,
            merchant=order.merchant,
            payment_method=payment_method,
            amount=order.total,
            currency='INR',
            gateway='demo' if payment_method != 'COD' else 'cod',
            is_demo_payment=payment_method != 'COD',
            payment_details=payment_details or {},
            status=Payment.STATUS_COD_PENDING if payment_method == 'COD' else Payment.STATUS_PENDING
        )
        
        # Create payment event
        PaymentEvent.objects.create(
            payment=payment,
            event_type='created',
            payload={'payment_method': payment_method}
        )
        
        logger.info(f"Payment created: {payment.id} for order {order.order_number}")
        
        return payment
    
    @transaction.atomic
    def process_payment(self, payment, payment_data=None):
        """
        Process a payment through the payment provider
        
        Args:
            payment: Payment instance
            payment_data: Optional dict with additional payment data
        
        Returns:
            dict with success status and result
        """
        if payment.payment_method == 'COD':
            # COD doesn't need processing
            return {
                'success': True,
                'status': 'cod_pending',
                'message': 'Cash on delivery order confirmed'
            }
        
        # Update status to processing
        payment.status = Payment.STATUS_PROCESSING
        payment.save(update_fields=['status'])
        
        PaymentEvent.objects.create(
            payment=payment,
            event_type='processing',
            payload=payment_data or {}
        )
        
        # Process through provider
        result = self.provider.process(
            payment_id=payment.id,
            amount=float(payment.amount),
            currency=payment.currency,
            payment_method=payment.payment_method,
            payment_details=payment.payment_details,
            payment_data=payment_data
        )
        
        # Update payment based on result
        if result['success']:
            payment.status = Payment.STATUS_PAID
            payment.transaction_id = result.get('transaction_id', '')
            payment.gateway_payment_id = result.get('gateway_payment_id', '')
            payment.failure_reason = ''
            
            PaymentEvent.objects.create(
                payment=payment,
                event_type='paid',
                gateway_event_id=result.get('transaction_id', ''),
                payload=result
            )
            
            # Update order status
            order = payment.order
            if order.status != 'Confirmed':
                order.status = 'Confirmed' if order.risk_tier != 'High' else 'Review'
                order.save(update_fields=['status'])
            
        else:
            payment.status = Payment.STATUS_FAILED
            payment.failure_reason = result.get('message', 'Payment failed')
            
            PaymentEvent.objects.create(
                payment=payment,
                event_type='failed',
                payload=result
            )
        
        payment.save(update_fields=[
            'status', 'transaction_id', 'gateway_payment_id', 'failure_reason'
        ])
        
        logger.info(f"Payment processed: {payment.id} - Status: {payment.status}")
        
        return result
    
    @transaction.atomic
    def mark_payment_rejected(self, payment, reason=''):
        """Mark payment as rejected by gateway"""
        payment.status = Payment.STATUS_REJECTED
        payment.failure_reason = reason
        payment.save(update_fields=['status', 'failure_reason'])
        
        PaymentEvent.objects.create(
            payment=payment,
            event_type='rejected',
            payload={'reason': reason}
        )
        
        logger.warning(f"Payment rejected: {payment.id} - Reason: {reason}")

    @transaction.atomic
    def handle_webhook(self, payload: dict, signature: str):
        """Process gateway signed webhook and reconcile payment status"""
        from common.exceptions import AppError, NotFoundError
        from .gateway import get_gateway
        from invoices.tasks import generate_and_send_invoice
        
        gateway_name = payload.get("gateway", "mock")
        try:
            gateway = get_gateway(gateway_name)
        except ValueError:
            raise AppError("Gateway not supported.", code="UNKNOWN_GATEWAY")
            
        if not gateway.verify_signature(payload, signature):
            raise AppError("Webhook signature verification failed.", code="PAYMENT_SIGNATURE_INVALID")
            
        order_id = payload.get("order_id")
        event_id = payload.get("event_id") or payload.get("gateway_payment_id") or str(uuid.uuid4())
        
        # Idempotency check
        existing_event = PaymentEvent.objects.filter(gateway_event_id=event_id).first()
        if existing_event:
            return existing_event.payment, existing_event, False
            
        payment = Payment.objects.select_related("order").filter(order_id=order_id).first()
        if not payment:
            payment = Payment.objects.select_related("order").filter(order__order_number=order_id).first()
        if not payment:
            raise NotFoundError("Payment for this order was not found.", code="PAYMENT_NOT_FOUND")
            
        status_val = str(payload.get("status", "")).lower()
        changed = False
        if status_val in ("paid", "success"):
            if payment.status != Payment.STATUS_PAID:
                payment.status = Payment.STATUS_PAID
                payment.gateway_payment_id = payload.get("gateway_payment_id", "")
                payment.transaction_id = payload.get("transaction_id", f"TXN-{uuid.uuid4().hex[:8].upper()}")
                payment.save(update_fields=["status", "gateway_payment_id", "transaction_id"])
                
                order = payment.order
                order.status = "Confirmed"
                order.save(update_fields=["status"])
                changed = True
                
                # Trigger background invoice generation
                try:
                    generate_and_send_invoice(order.id)
                except Exception as e:
                    logger.warning(f"Failed to trigger invoice for webhook order {order.id}: {e}")
                    
        event = PaymentEvent.objects.create(
            payment=payment,
            event_type=status_val or "webhook",
            gateway_event_id=event_id,
            payload=payload,
        )
        return payment, event, changed
    
    def get_payment_status(self, payment_id):
        """Get current payment status"""
        try:
            payment = Payment.objects.get(id=payment_id)
            return {
                'payment_id': payment.id,
                'status': payment.status,
                'payment_method': payment.payment_method,
                'amount': float(payment.amount),
                'transaction_id': payment.transaction_id,
                'failure_reason': payment.failure_reason
            }
        except Payment.DoesNotExist:
            return None


class DemoPaymentProvider:
    """
    Demo/Simulated Payment Provider
    
    This provider simulates payment processing for testing and development.
    It can be replaced with real payment gateway providers (Razorpay, Stripe, etc.)
    without changing the PaymentService interface.
    
    Success rate: Configurable (default 90% for testing)
    """
    
    def __init__(self, success_rate=0.9):
        self.success_rate = success_rate
    
    def process(self, payment_id, amount, currency, payment_method, payment_details, payment_data):
        """
        Simulate payment processing
        
        Returns:
            dict with success, transaction_id, and message
        """
        logger.info(f"Demo payment processing: {payment_method} - ₹{amount}")
        
        # Simulate processing delay
        import time
        time.sleep(0.5)  # Simulate network latency
        
        # Randomly determine success/failure based on success_rate
        is_success = random.random() < self.success_rate
        
        if is_success:
            transaction_id = self._generate_transaction_id(payment_method)
            gateway_payment_id = f"DEMO_{uuid.uuid4().hex[:12].upper()}"
            
            result = {
                'success': True,
                'status': 'paid',
                'transaction_id': transaction_id,
                'gateway_payment_id': gateway_payment_id,
                'message': f'{self._get_payment_method_display(payment_method)} payment successful',
                'timestamp': timezone.now().isoformat(),
                'amount': amount,
                'currency': currency,
            }
            
            # Add payment method specific data
            if payment_method == 'UPI':
                result['upi_id'] = payment_details.get('upi_id', 'demo@upi')
            elif payment_method in ['CREDIT_CARD', 'DEBIT_CARD']:
                result['card_last4'] = payment_details.get('card_number', '****1234')[-4:]
                result['card_type'] = payment_details.get('card_type', 'Visa')
            elif payment_method == 'NET_BANKING':
                result['bank_name'] = payment_details.get('bank_name', 'Demo Bank')
            elif payment_method == 'MOBILE_BANKING':
                result['bank_name'] = payment_details.get('bank_name', 'Demo Mobile Bank')
            
            logger.info(f"Demo payment successful: {transaction_id}")
            
        else:
            # Simulate failure
            failure_reasons = [
                'Insufficient balance',
                'Transaction declined by bank',
                'Payment timeout',
                'Invalid payment details',
                'Bank server unavailable'
            ]
            
            result = {
                'success': False,
                'status': 'failed',
                'transaction_id': '',
                'gateway_payment_id': '',
                'message': random.choice(failure_reasons),
                'timestamp': timezone.now().isoformat(),
                'amount': amount,
                'currency': currency,
            }
            
            logger.warning(f"Demo payment failed: {result['message']}")
        
        return result
    
    def _generate_transaction_id(self, payment_method):
        """Generate a realistic-looking demo transaction ID"""
        method_prefix = {
            'UPI': 'UPI',
            'CREDIT_CARD': 'CC',
            'DEBIT_CARD': 'DC',
            'NET_BANKING': 'NB',
            'MOBILE_BANKING': 'MB',
        }.get(payment_method, 'PMT')
        
        return f"{method_prefix}{uuid.uuid4().hex[:10].upper()}"
    
    def _get_payment_method_display(self, payment_method):
        """Get human-readable payment method name"""
        return {
            'UPI': 'UPI',
            'CREDIT_CARD': 'Credit Card',
            'DEBIT_CARD': 'Debit Card',
            'NET_BANKING': 'Net Banking',
            'MOBILE_BANKING': 'Mobile Banking',
        }.get(payment_method, payment_method)


class RealPaymentProvider:
    """
    Placeholder for real payment gateway provider
    
    This class shows how a real payment provider would be implemented.
    When integrating a real gateway (Razorpay, Stripe, etc.):
    
    1. Install the gateway SDK
    2. Implement this class with actual API calls
    3. Update PaymentService to use RealPaymentProvider instead of DemoPaymentProvider
    4. Configure gateway credentials in settings
    
    The PaymentService interface remains unchanged.
    """
    
    def __init__(self, api_key, api_secret):
        self.api_key = api_key
        self.api_secret = api_secret
        # Initialize real gateway SDK here
    
    def process(self, payment_id, amount, currency, payment_method, payment_details, payment_data):
        """
        Process payment through real gateway
        
        Implementation would include:
        - Calling real gateway API
        - Handling webhooks
        - Verifying payment signatures
        - Managing gateway-specific flows
        """
        raise NotImplementedError("Real payment gateway not yet configured")
