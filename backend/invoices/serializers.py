from rest_framework import serializers

from .models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = (
            "id",
            "order_id",
            "invoice_number",
            "invoice_url",
            "status",
            "generated_at",
        )
