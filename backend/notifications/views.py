from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from common.response import success
from .models import InAppNotification
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = InAppNotification.objects.filter(user=request.user)
        return success(NotificationSerializer(qs, many=True).data)


class MarkNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        InAppNotification.objects.filter(user=request.user, read=False).update(read=True)
        qs = InAppNotification.objects.filter(user=request.user)
        return success(NotificationSerializer(qs, many=True).data)
