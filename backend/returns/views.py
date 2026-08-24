from django.utils import timezone
from rest_framework import status
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from common.exceptions import AppError, NotFoundError
from common.response import success
from common.tenancy import get_merchant_from_user
from .models import DoorstepProof, ReturnRequest
from .serializers import (
    CreateReturnSerializer,
    DoorstepProofSerializer,
    ReturnRequestSerializer,
)
from .services import ReturnService


class ReturnListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            ReturnRequest.objects.filter(user=request.user)
            .select_related("order")
            .prefetch_related("return_lines", "timeline")
            .order_by("-created_at")
        )
        return success(ReturnRequestSerializer(qs, many=True).data)

    def post(self, request):
        serializer = CreateReturnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        merchant = get_merchant_from_user(request.user)
        if merchant is None:
            raise AppError("Merchant context could not be resolved.", code="MERCHANT_NOT_FOUND")

        return_request = ReturnService().create_return(
            user=request.user,
            merchant=merchant,
            data=serializer.validated_data,
        )
        return success(
            ReturnRequestSerializer(return_request).data,
            status=status.HTTP_201_CREATED,
        )


class ShopperReturnDetailView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ReturnRequestSerializer
    lookup_field = "pk"

    def get_queryset(self):
        return ReturnRequest.objects.filter(user=self.request.user).select_related("order").prefetch_related(
            "return_lines", "timeline"
        )


class ReturnTimelineView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        return_request = ReturnRequest.objects.filter(user=request.user, pk=pk).first()
        if return_request is None:
            raise NotFoundError("Return not found.")
        timeline = [
            {"label": e.label, "at": e.at.isoformat()} for e in return_request.timeline.all()
        ]
        return success(timeline)


class EscalateReturnView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        return_request = ReturnRequest.objects.filter(user=request.user, pk=pk).first()
        if return_request is None:
            raise NotFoundError("Return not found.")
        reason = request.data.get("escalation_reason", "OTP unavailable or failed")
        return_request.status = "manual_review"
        return_request.outcome = "pending_review"
        return_request.verification_status = "Escalated"
        return_request.verification_method = "unverified"
        return_request.risk_score = min(100, return_request.risk_score + 8)
        return_request.save()
        from .models import ReturnEvent

        ReturnEvent.objects.create(return_request=return_request, label=reason)
        ReturnEvent.objects.create(return_request=return_request, label="Escalated to review")
        return success(ReturnRequestSerializer(return_request).data)


class ReturnProofView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        return_request = ReturnRequest.objects.filter(user=request.user, pk=pk).first()
        if return_request is None:
            raise NotFoundError("Return not found.")
        proofs = return_request.proofs.all()
        return success(DoorstepProofSerializer(proofs, many=True).data)

    def post(self, request, pk):
        return_request = ReturnRequest.objects.filter(pk=pk).first()
        if return_request is None:
            raise NotFoundError("Return not found.")

        image_url = request.data.get("image_url") or request.data.get("proof_url")
        if image_url:
            return_request.proof_image_url = image_url
            return_request.save(update_fields=["proof_image_url"])
            return success({
                "id": return_request.id,
                "proof_image_url": return_request.proof_image_url,
                "proof_verified": return_request.proof_verified,
                "message": "Return proof photo uploaded successfully.",
            })

        serializer = DoorstepProofSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        proof = serializer.save(return_request=return_request)
        if proof.file:
            return_request.proof_image_url = proof.file.url
            return_request.save(update_fields=["proof_image_url"])
        return success(DoorstepProofSerializer(proof).data, status=status.HTTP_201_CREATED)

