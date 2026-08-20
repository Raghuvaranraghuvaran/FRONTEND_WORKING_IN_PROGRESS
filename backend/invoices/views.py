from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from common.exceptions import NotFoundError
from common.response import success
from .models import Invoice
from .serializers import InvoiceSerializer


class InvoiceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        invoice = Invoice.objects.filter(order__user=request.user, pk=pk).first()
        if invoice is None:
            raise NotFoundError("Invoice not found.")
        return success(InvoiceSerializer(invoice).data)


class OrderInvoiceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_pk):
        invoice = Invoice.objects.filter(order__user=request.user, order_id=order_pk).first()
        if invoice is None:
            raise NotFoundError("Invoice not found for this order.")
        return success(InvoiceSerializer(invoice).data)
