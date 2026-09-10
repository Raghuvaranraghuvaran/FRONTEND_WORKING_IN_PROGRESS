from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from common.response import success
from .models import InAppNotification
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user and request.user.is_authenticated:
            qs = InAppNotification.objects.filter(user=request.user)
        else:
            qs = InAppNotification.objects.none()
        return success(NotificationSerializer(qs, many=True).data)


class MarkNotificationsReadView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if request.user and request.user.is_authenticated:
            InAppNotification.objects.filter(user=request.user, read=False).update(read=True)
            qs = InAppNotification.objects.filter(user=request.user)
        else:
            qs = InAppNotification.objects.none()
        return success(NotificationSerializer(qs, many=True).data)

