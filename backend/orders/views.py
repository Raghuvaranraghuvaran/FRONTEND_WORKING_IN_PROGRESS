from django.db.models import Prefetch
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from common.exceptions import AppError
from common.response import success
from common.tenancy import get_merchant_from_user
from .models import Order, OrderItem
from .serializers import CheckoutSerializer, OrderListSerializer
from .services import CheckoutService


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        merchant = get_merchant_from_user(request.user)
        if merchant is None:
            raise AppError("Merchant context could not be resolved.", code="MERCHANT_NOT_FOUND")

        try:
            order, payment, decision = CheckoutService().create_order(
                user=request.user,
                merchant=merchant,
                items=data["items"],
                payment_method=data["payment_method"],
                payment_details=data.get("payment_details"),
                discount=data.get("discount", 0),
                reward_points_used=data.get("reward_points_used", 0),
                device_token=data.get("device_token", ""),
            )
        except ValueError as exc:
            raise AppError(str(exc), code="CHECKOUT_FAILED")

        from payments.serializers import PaymentSerializer
        from accounts.serializers import ShopperSerializer
        
        return success({
            "order": OrderListSerializer(order).data,
            "payment": PaymentSerializer(payment).data,
            "decision": decision,
            "user": ShopperSerializer(request.user).data,
        }, status=status.HTTP_201_CREATED)


class ShopperOrderListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderListSerializer

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related("items")
            .order_by("-created_at")
        )


class ShopperOrderDetailView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderListSerializer
    lookup_field = "pk"

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items")


class TrackOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        order = Order.objects.filter(user=request.user, pk=pk).first()
        if order is None:
            raise AppError("Order not found.", code="NOT_FOUND")
        return success(order.tracking_events)
