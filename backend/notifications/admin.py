from django.contrib import admin

from .models import EmailDelivery, InAppNotification

admin.site.register(EmailDelivery)
admin.site.register(InAppNotification)
