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
    """Process a demo payment"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from .serializers import ProcessPaymentSerializer
        from django.db import transaction
        from invoices.tasks import generate_and_send_invoice
        
        serializer = ProcessPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        payment_id = serializer.validated_data['payment_id']
        payment_data = serializer.validated_data.get('payment_data')
        
        try:
            from .models import Payment
            payment = Payment.objects.select_related('order').get(
                id=payment_id,
                order__user=request.user
            )
        except Payment.DoesNotExist:
            raise AppError("Payment not found or unauthorized", code="PAYMENT_NOT_FOUND")
        
        # Process payment through service
        payment_service = PaymentService()
        result = payment_service.process_payment(payment, payment_data)
        
        # If successful, trigger official invoice generation and email with PDF
        if result['success']:
            transaction.on_commit(lambda: generate_and_send_invoice.delay(payment.order.id))
        else:
            # Send single payment failure notification email
            from common.mailer import send_async_email
            failure_reason = result.get('message', payment.failure_reason or 'Payment declined by bank')
            send_async_email(
                subject=f"Payment Failed for Order {payment.order.order_number}",
                message=(
                    f"Hi {request.user.name or 'Customer'},\n\n"
                    f"We were unable to process your payment of Rs. {payment.amount} for order {payment.order.order_number}.\n\n"
                    f"Failure Reason: {failure_reason}\n"
                    f"Payment Method: {payment.payment_method}\n\n"
                    "You can retry your payment or select Cash on Delivery (COD) by visiting My Orders in your ReturnGuard account.\n\n"
                    "— ReturnGuard Team"
                ),
                recipient_list=[request.user.email],
            )
        
        # Refresh payment from DB
        payment.refresh_from_db()
        
        return success({
            'payment': PaymentSerializer(payment).data,
            'result': result
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
