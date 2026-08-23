"""
PDF Invoice Generator for ReturnGuard
Generates professional invoices for successful orders
"""
import io
from datetime import datetime
from decimal import Decimal

from django.conf import settings
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.pdfgen import canvas


class InvoicePDFGenerator:
    """Generate professional PDF invoices"""
    
    def __init__(self, order, invoice):
        self.order = order
        self.invoice = invoice
        self.merchant = order.merchant
        self.customer = order.user
        self.payment = getattr(order, 'payment', None)
        self.buffer = io.BytesIO()
        
    def generate(self):
        """Generate PDF and return buffer"""
        # Create PDF document
        doc = SimpleDocTemplate(
            self.buffer,
            pagesize=A4,
            rightMargin=0.5*inch,
            leftMargin=0.5*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )
        
        # Build content
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#6366f1'),
            spaceAfter=30,
        )
        
        # Header - Invoice Title
        story.append(Paragraph("INVOICE", title_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Merchant and Customer Info
        info_data = [
            [self._get_merchant_info(), self._get_customer_info()],
        ]
        
        info_table = Table(info_data, colWidths=[3.5*inch, 3.5*inch])
        info_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Invoice Details
        story.append(self._get_invoice_details())
        story.append(Spacer(1, 0.3*inch))
        
        # Order Items Table
        story.append(self._get_items_table())
        story.append(Spacer(1, 0.3*inch))
        
        # Payment Info
        story.append(self._get_payment_info())
        story.append(Spacer(1, 0.5*inch))
        
        # Footer
        story.append(self._get_footer())
        
        # Build PDF
        doc.build(story)
        
        # Get PDF content
        pdf_content = self.buffer.getvalue()
        self.buffer.close()
        
        return pdf_content
    
    def _get_merchant_info(self):
        """Get merchant/business information"""
        lines = [
            f"<b>{self.merchant.business_name}</b>",
            f"Merchant ID: {self.merchant.id}",
            f"Store: {self.merchant.store_slug}",
            f"Email: {self.merchant.admin_email}",
        ]
        return Paragraph("<br/>".join(lines), getSampleStyleSheet()['Normal'])
    
    def _get_customer_info(self):
        """Get customer information"""
        customer_id = getattr(getattr(self.customer, 'shopper_profile', None), 'customer_id', 'N/A')
        
        lines = [
            "<b>Bill To:</b>",
            f"{self.customer.name}",
            f"Customer ID: {customer_id}",
            f"Email: {self.customer.email}",
            f"Phone: {getattr(self.customer, 'phone', 'N/A')}",
        ]
        
        if self.order.delivery_address:
            lines.append(f"<br/><b>Shipping Address:</b><br/>{self.order.delivery_address}")
        
        return Paragraph("<br/>".join(lines), getSampleStyleSheet()['Normal'])
    
    def _get_invoice_details(self):
        """Get invoice metadata table"""
        data = [
            ['Invoice Number:', self.invoice.invoice_number],
            ['Invoice Date:', self.invoice.generated_at.strftime('%b %d, %Y %I:%M %p')],
            ['Order Number:', self.order.order_number],
            ['Order Date:', self.order.created_at.strftime('%b %d, %Y %I:%M %p')],
        ]
        
        table = Table(data, colWidths=[2*inch, 5*inch])
        table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#475569')),
        ]))
        return table
    
    def _get_items_table(self):
        """Get order items table"""
        # Header
        data = [
            ['Product', 'SKU', 'Qty', 'Unit Price', 'Subtotal']
        ]
        
        # Items
        for item in self.order.items.all():
            product_id = str(item.product.id) if item.product else 'N/A'
            data.append([
                item.name,
                product_id,
                str(item.quantity),
                f"₹{item.price:,.2f}",
                f"₹{item.price * item.quantity:,.2f}",
            ])
        
        # Totals
        subtotal = self.order.total
        discount = Decimal('0.00')  # Can be enhanced later
        tax = Decimal('0.00')  # Can be enhanced later
        shipping = Decimal('0.00')  # Can be enhanced later
        grand_total = subtotal + tax + shipping - discount
        
        data.append(['', '', '', '', ''])  # Spacer
        data.append(['', '', '', 'Subtotal:', f"₹{subtotal:,.2f}"])
        if discount > 0:
            data.append(['', '', '', 'Discount:', f"-₹{discount:,.2f}"])
        if tax > 0:
            data.append(['', '', '', 'Tax:', f"₹{tax:,.2f}"])
        if shipping > 0:
            data.append(['', '', '', 'Shipping:', f"₹{shipping:,.2f}"])
        data.append(['', '', '', '<b>Grand Total:</b>', f"<b>₹{grand_total:,.2f}</b>"])
        
        table = Table(data, colWidths=[2.5*inch, 1*inch, 0.7*inch, 1.3*inch, 1.5*inch])
        table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6366f1')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('TOPPADDING', (0, 0), (-1, 0), 10),
            
            # Items
            ('FONTNAME', (0, 1), (-1, -6), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -6), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -6), [colors.white, colors.HexColor('#f8fafc')]),
            ('GRID', (0, 0), (-1, -6), 0.5, colors.HexColor('#e2e8f0')),
            ('BOTTOMPADDING', (0, 1), (-1, -6), 8),
            ('TOPPADDING', (0, 1), (-1, -6), 8),
            
            # Totals
            ('FONTNAME', (3, -5), (3, -1), 'Helvetica-Bold'),
            ('FONTNAME', (4, -5), (4, -1), 'Helvetica'),
            ('FONTSIZE', (3, -5), (-1, -1), 10),
            ('ALIGN', (3, -5), (-1, -1), 'RIGHT'),
            ('BOTTOMPADDING', (3, -5), (-1, -1), 5),
            
            # Grand total
            ('FONTNAME', (4, -1), (4, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (3, -1), (-1, -1), 12),
        ]))
        
        return table
    
    def _get_payment_info(self):
        """Get payment information"""
        if not self.payment:
            return Paragraph("<b>Payment Status:</b> Pending", getSampleStyleSheet()['Normal'])
        
        payment_method_display = self.payment.get_payment_method_display()
        status_display = self.payment.get_status_display()
        
        lines = [
            f"<b>Payment Method:</b> {payment_method_display}",
            f"<b>Payment Status:</b> {status_display}",
        ]
        
        if self.payment.transaction_id:
            lines.append(f"<b>Transaction ID:</b> {self.payment.transaction_id}")
        
        if self.payment.payment_method == 'COD':
            lines.append("<b>Note:</b> Payment to be collected on delivery")
        elif self.payment.is_demo_payment:
            lines.append("<b>Demo Payment:</b> This is a simulated transaction for testing")
        
        return Paragraph("<br/>".join(lines), getSampleStyleSheet()['Normal'])
    
    def _get_footer(self):
        """Get invoice footer"""
        text = """
        <para align=center>
        <font size=8 color="#94a3b8">
        <b>Thank you for your business!</b><br/>
        This is a computer-generated invoice and does not require a signature.<br/>
        For any queries, please contact {email}
        </font>
        </para>
        """.format(email=self.merchant.admin_email)
        
        return Paragraph(text, getSampleStyleSheet()['Normal'])
