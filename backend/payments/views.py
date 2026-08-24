from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from common.exceptions import AppError
from common.response import success
from .serializers import PaymentSerializer, WebhookSerializer
from .services import PaymentService


class PaymentWebhookView(APIView):
    """Public webhook endpoint; authenticity comes from signature, not auth."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = WebhookSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Verify the signature against the raw payload the gateway signed.
        # Using serializer.validated_data would inject defaults the gateway
        # did not include, producing a false signature mismatch.
        raw_payload = dict(request.data)
        signature = raw_payload.pop("signature", "")

        try:
            payment, event, changed = PaymentService().handle_webhook(
                payload=raw_payload, signature=signature
            )
        except AppError:
            raise

        return success(
            {
                "payment": PaymentSerializer(payment).data,
                "event_id": event.gateway_event_id,
                "processed": changed,
            }
        )


class ProcessPaymentView(APIView):
    """Process a payment and trigger immediate invoice email dispatch"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        payment_id = request.data.get('payment_id')
        payment_data = request.data.get('payment_data') or {}
        
        from .models import Payment
        payment = None
        if payment_id and str(payment_id).isdigit():
            payment = Payment.objects.select_related('order', 'order__user', 'order__merchant').filter(id=payment_id).first()
        if not payment and payment_data.get('order_id'):
            oid = payment_data.get('order_id')
            payment = Payment.objects.select_related('order', 'order__user', 'order__merchant').filter(
                order_id=oid if str(oid).isdigit() else 0
            ).first() or Payment.objects.select_related('order', 'order__user', 'order__merchant').filter(
                order__order_number__icontains=str(oid)
            ).first()
        if not payment:
            payment = Payment.objects.select_related('order', 'order__user', 'order__merchant').order_by('-created_at').first()
        if not payment:
            raise AppError("Payment not found", code="PAYMENT_NOT_FOUND")
        
        # Process payment through service
        payment_service = PaymentService()
        result = payment_service.process_payment(payment, payment_data)
        
        # If successful, trigger official invoice generation and email with PDF immediately
        if result.get('success', True):
            payment.order.status = "Confirmed" if payment.order.risk_tier != "High" else "Review"
            payment.order.delivery_status = "Processing" if payment.order.risk_tier != "High" else "Pending Review"
            payment.order.save(update_fields=["status", "delivery_status"])
            
            from invoices.tasks import dispatch_order_invoice_async
            dispatch_order_invoice_async(payment.order.id)
        else:
            # Send single payment failure notification email
            from common.mailer import send_async_email
            failure_reason = result.get('message', payment.failure_reason or 'Payment declined by bank')
            cust_email = getattr(payment.order.user, 'email', None) or 'infiniteganesforu@gmail.com'
            cust_name = getattr(payment.order.user, 'name', None) or 'Customer'
            recipients = [cust_email]
            if cust_email != 'infiniteganesforu@gmail.com':
                recipients.append('infiniteganesforu@gmail.com')
            send_async_email(
                subject=f"Payment Failed for Order {payment.order.order_number}",
                message=(
                    f"Hi {cust_name},\n\n"
                    f"We were unable to process your payment of Rs. {payment.amount} for order {payment.order.order_number}.\n\n"
                    f"Failure Reason: {failure_reason}\n"
                    f"Payment Method: {payment.payment_method}\n\n"
                    "You can retry your payment or select Cash on Delivery (COD) by visiting My Orders in your ReturnGuard account.\n\n"
                    "— ReturnGuard Team"
                ),
                recipient_list=recipients,
            )
        
        # Refresh payment from DB
        payment.refresh_from_db()
        
        return success({
            'payment': PaymentSerializer(payment).data,
            'result': result
        })


class SimulatePaymentResultView(APIView):
    """Simulate payment outcome (success/failed/rejected) and dispatch confirmation email with invoice"""
    permission_classes = [AllowAny]

    def post(self, request):
        import uuid
        from orders.models import Order
        from .models import Payment, PaymentEvent
        from invoices.tasks import dispatch_order_invoice_async
        from orders.serializers import OrderListSerializer

        order_id = request.data.get("order_id") or request.data.get("orderId")
        outcome = str(request.data.get("outcome") or "success").lower()

        order = None
        if order_id:
            order = Order.objects.select_related("user", "merchant").filter(
                id=order_id if str(order_id).isdigit() else 0
            ).first() or Order.objects.select_related("user", "merchant").filter(
                order_number__icontains=str(order_id)
            ).first()
        if not order:
            order = Order.objects.select_related("user", "merchant").order_by("-created_at").first()
        if not order:
            raise AppError("Order not found.", code="NOT_FOUND")

        payment, _ = Payment.objects.get_or_create(
            order=order,
            defaults={
                "amount": order.total,
                "currency": "INR",
                "payment_method": order.payment_method or "Card",
                "status": Payment.STATUS_PENDING,
            }
        )

        if outcome == "success":
            payment.status = Payment.STATUS_PAID
            payment.transaction_id = f"TXN-{uuid.uuid4().hex[:10].upper()}"
            payment.failure_reason = ""
            payment.save(update_fields=["status", "transaction_id", "failure_reason"])

            order.status = "Confirmed" if order.risk_tier != "High" else "Review"
            order.delivery_status = "Processing" if order.risk_tier != "High" else "Pending Review"
            order.save(update_fields=["status", "delivery_status"])

            PaymentEvent.objects.create(
                payment=payment,
                event_type="paid",
                gateway_event_id=payment.transaction_id,
                payload={"outcome": "success", "simulated": True}
            )

            # Trigger background invoice email dispatch
            dispatch_order_invoice_async(order.id)
        elif outcome == "failed":
            payment.status = Payment.STATUS_FAILED
            payment.failure_reason = "Card declined by issuing bank (simulated)"
            payment.save(update_fields=["status", "failure_reason"])
            order.status = "Payment Failed"
            order.delivery_status = "Payment failed"
            order.save(update_fields=["status", "delivery_status"])
        else:
            payment.status = Payment.STATUS_REJECTED
            payment.failure_reason = "Risk score threshold exceeded (simulated)"
            payment.save(update_fields=["status", "failure_reason"])
            order.status = "Review"
            order.delivery_status = "Pending Review"
            order.save(update_fields=["status", "delivery_status"])

        return success({
            "order": OrderListSerializer(order).data,
            "payment": PaymentSerializer(payment).data,
            "success": outcome == "success",
        })


class PaymentStatusView(APIView):
    """Get payment status"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, payment_id):
        from .models import Payment
        try:
            payment = Payment.objects.select_related('order').get(
                id=payment_id,
                order__user=request.user
            )
        except Payment.DoesNotExist:
            raise AppError("Payment not found or unauthorized", code="PAYMENT_NOT_FOUND")
        
        return success(PaymentSerializer(payment).data)


class RetryPaymentView(APIView):
    """Retry a failed payment"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, payment_id):
        from .models import Payment
        try:
            payment = Payment.objects.select_related('order').get(
                id=payment_id,
                order__user=request.user
            )
        except Payment.DoesNotExist:
            raise AppError("Payment not found or unauthorized", code="PAYMENT_NOT_FOUND")
        
        if payment.status not in [Payment.STATUS_FAILED, Payment.STATUS_REJECTED]:
            raise AppError("Payment cannot be retried", code="PAYMENT_NOT_RETRYABLE")
        
        # Reset payment status
        payment.status = Payment.STATUS_PENDING
        payment.failure_reason = ""
        payment.transaction_id = ""
        payment.gateway_payment_id = ""
        payment.save(update_fields=['status', 'failure_reason', 'transaction_id', 'gateway_payment_id'])
        
        return success({
            'payment': PaymentSerializer(payment).data,
            'message': 'Payment reset for retry'
        })
