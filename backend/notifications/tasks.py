from celery import shared_task

from .models import EmailDelivery


@shared_task
def send_email_delivery(delivery_id):
    """Send a queued email delivery.

    In the mock-first sequence this simply marks the record sent. Replace the
    body with a real email provider (SMTP/SES) when connecting production
    notifications.
    """
    delivery = EmailDelivery.objects.filter(pk=delivery_id).first()
    if delivery is None or delivery.status != "queued":
        return
    # Real email sending integration goes here.
    from django.utils import timezone

    delivery.status = "sent"
    delivery.sent_at = timezone.now()
    delivery.save(update_fields=["status", "sent_at"])
    return delivery_id
