"""
Invoice API Views
"""
from django.http import FileResponse, HttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from common.exceptions import AppError, NotFoundError
from common.permissions import IsMerchantAdmin
from common.response import success
from .models import Invoice
from .serializers import InvoiceSerializer


class DownloadInvoiceView(APIView):
    """Download invoice PDF - Shopper access"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, invoice_id):
        # Look up by invoice ID first, then fallback to order ID
        invoice = Invoice.objects.select_related('order', 'order__user', 'order__merchant').filter(
            id=invoice_id,
            order__user=request.user
        ).first()
        
        if not invoice:
            invoice = Invoice.objects.select_related('order', 'order__user', 'order__merchant').filter(
                order_id=invoice_id,
                order__user=request.user
            ).first()
            
        if not invoice:
            raise NotFoundError("Invoice not found or unauthorized")
        
        # If PDF is not yet generated or missing, generate it on demand
        if not invoice.pdf_file:
            from .pdf_generator import InvoicePDFGenerator
            from django.core.files.base import ContentFile
            generator = InvoicePDFGenerator(invoice.order, invoice)
            pdf_content = generator.generate()
            filename = f"Invoice-{invoice.invoice_number}.pdf"
            invoice.pdf_file.save(filename, ContentFile(pdf_content), save=True)
        
        # Return PDF file
        response = FileResponse(
            invoice.pdf_file.open('rb'),
            content_type='application/pdf'
        )
        response['Content-Disposition'] = f'attachment; filename="Invoice-{invoice.invoice_number}.pdf"'
        return response


class MerchantInvoiceDownloadView(APIView):
    """Download invoice PDF - Merchant access"""
    permission_classes = [IsAuthenticated, IsMerchantAdmin]
    
    def get(self, request, invoice_id):
        try:
            invoice = Invoice.objects.select_related('order__merchant').get(id=invoice_id)
        except Invoice.DoesNotExist:
            raise NotFoundError("Invoice not found")
        
        # Verify merchant owns this invoice
        from common.tenancy import get_merchant_from_user
        merchant = get_merchant_from_user(request.user)
        
        if invoice.order.merchant != merchant:
            raise AppError("Unauthorized access to invoice", code="UNAUTHORIZED")
        
        if not invoice.pdf_file:
            raise AppError("Invoice PDF not yet generated", code="PDF_NOT_READY")
        
        # Return PDF file
        response = FileResponse(
            invoice.pdf_file.open('rb'),
            content_type='application/pdf'
        )
        response['Content-Disposition'] = f'attachment; filename="{invoice.invoice_number}.pdf"'
        return response


class InvoiceDetailView(APIView):
    """Get invoice details"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, invoice_id):
        try:
            invoice = Invoice.objects.select_related('order').get(
                id=invoice_id,
                order__user=request.user
            )
        except Invoice.DoesNotExist:
            raise NotFoundError("Invoice not found or unauthorized")
        
        return success(InvoiceSerializer(invoice).data)
