from django.urls import path

from . import views

urlpatterns = [
    path("", views.AnalyticsOverviewView.as_view(), name="analytics-overview"),
]
