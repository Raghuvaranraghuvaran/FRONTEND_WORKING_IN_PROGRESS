from rest_framework import serializers

from .models import InAppNotification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = InAppNotification
        fields = ("id", "type", "channel", "title", "body", "read", "created_at")
