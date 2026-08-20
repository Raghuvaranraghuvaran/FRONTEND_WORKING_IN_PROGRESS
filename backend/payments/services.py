from django.db import transaction

from invoices.models import Invoice
from notifications.models import EmailDelivery
from .gateway import get_gateway
from .models import Payment, PaymentEvent


class PaymentService:
    """Apply a webhook-verified payment outcome idempotently."""

    EVENT_MAP = {
        "paid": "paid",
        "failed": "failed",
        "rejected": "rejected",
        "processing": "processing",
    }

    @transaction.atomic
    def handle_webhook(self, *, payload, signature):
        gateway = get_gateway(payload.get("gateway", "mock"))
        if not gateway.verify_signature(payload, signature):
            from common.exceptions import PaymentSignatureInvalid

            raise PaymentSignatureInvalid()

        order_id = payload.get("order_id")
        payment = Payment.objects.select_for_update().filter(order_id=order_id).first()
        if payment is None:
            from common.exceptions import NotFoundError

            raise NotFoundError("Payment not found for this order.")

        gateway_event_id = payload.get("event_id") or f"{payment.id}:{payload.get('status')}"
        event_type = self.EVENT_MAP.get(payload.get("status"), payload.get("status"))

        event, created = PaymentEvent.objects.get_or_create(
            payment=payment,
            gateway_event_id=gateway_event_id,
            defaults={
                "event_type": event_type,
                "payload": payload,
            },
        )
        if not created:
            return payment, event, False

        if "amount" in payload and payload["amount"]:
            payment.amount = payload["amount"]
        payment.gateway_payment_id = payload.get("gateway_payment_id", payment.gateway_payment_id)
        payment.status = event_type
        payment.failure_reason = payload.get("failure_reason", "")
        payment.save()

        self._apply_order_status(payment, event_type)
        self._enqueue_notification(payment, event_type)
        return payment, event, True

    def _apply_order_status(self, payment, event_type):
        order = payment.order
        if event_type == "paid":
            order.status = "Confirmed"
            order.delivery_status = "Processing"
        elif event_type == "failed":
            order.status = "Pending"
            order.delivery_status = "Processing"
        elif event_type == "rejected":
            order.status = "Pending"
            order.delivery_status = "Processing"
        order.save(update_fields=["status", "delivery_status"])

        if event_type == "paid":
            Invoice.objects.get_or_create(
                order=order,
                defaults={
                    "invoice_number": Invoice.generate_number(order),
                    "status": "generated",
                },
            )

    def _enqueue_notification(self, payment, event_type):
        EmailDelivery.objects.create(
            user=payment.order.user,
            event_type=f"payment_{event_type}",
            related_order=payment.order,
            status="queued",
        )
