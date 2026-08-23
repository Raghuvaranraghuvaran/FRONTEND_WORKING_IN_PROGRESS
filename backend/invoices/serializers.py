from rest_framework import serializers
from .models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    email_status_display = serializers.CharField(source='get_email_status_display', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    customer_name = serializers.CharField(source='order.customer_name', read_only=True)
    has_pdf = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'order', 'order_number', 'customer_name',
            'invoice_number', 'invoice_url', 'has_pdf',
            'status', 'status_display', 'generated_at',
            'email_status', 'email_status_display', 'email_sent_at',
            'email_attempts', 'email_last_error'
        ]
        read_only_fields = ['id', 'generated_at']
    
    def get_has_pdf(self, obj):
        return bool(obj.pdf_file)
