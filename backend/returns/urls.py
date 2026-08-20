from django.urls import path

from . import views

urlpatterns = [
    path("", views.ReturnListCreateView.as_view(), name="return-list-create"),
    path("<str:pk>/", views.ShopperReturnDetailView.as_view(), name="return-detail"),
    path("<str:pk>/timeline/", views.ReturnTimelineView.as_view(), name="return-timeline"),
    path("<str:pk>/escalate/", views.EscalateReturnView.as_view(), name="return-escalate"),
    path("<str:pk>/proof/", views.ReturnProofView.as_view(), name="return-proof"),
]
