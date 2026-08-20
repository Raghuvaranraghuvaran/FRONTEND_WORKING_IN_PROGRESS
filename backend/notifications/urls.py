from django.urls import path

from . import views

urlpatterns = [
    path("", views.NotificationListView.as_view(), name="notification-list"),
    path("read/", views.MarkNotificationsReadView.as_view(), name="notification-mark-read"),
]
