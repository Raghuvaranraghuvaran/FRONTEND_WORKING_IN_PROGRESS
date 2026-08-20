from rest_framework import status
from rest_framework.permissions import AllowAny
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
