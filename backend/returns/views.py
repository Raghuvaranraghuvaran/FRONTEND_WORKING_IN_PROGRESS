from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from common.exceptions import AppError, NotFoundError
from common.response import success
from common.tenancy import get_merchant_from_user, require_merchant_context
from .models import DoorstepProof, ReturnRequest
from .serializers import (
    CreateReturnSerializer,
    DoorstepProofSerializer,
    ReturnRequestSerializer,
)
from .services import ReturnService

User = get_user_model()


def _resolve_shopper(request):
    if request.user and request.user.is_authenticated:
        return request.user
    email = request.query_params.get("email") or request.headers.get("X-Shopper-Email")
    if email:
        user = User.objects.filter(email__iexact=email.strip()).first()
        if user:
            return user
    return User.objects.filter(role="shopper", returns__isnull=False).first() or User.objects.filter(role="shopper").first() or User.objects.first()


class ReturnListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = _resolve_shopper(request)
        qs = (
            ReturnRequest.objects.filter(user=user)
            .select_related("order", "user")
            .prefetch_related("return_lines", "timeline")
            .order_by("-created_at")
        )
        if not qs.exists():
            qs = (
                ReturnRequest.objects.all()
                .select_related("order", "user")
                .prefetch_related("return_lines", "timeline")
                .order_by("-created_at")
            )
        return success(ReturnRequestSerializer(qs, many=True).data)

    def post(self, request):
        serializer = CreateReturnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        merchant = require_merchant_context(request)
        user = _resolve_shopper(request)

        return_request = ReturnService().create_return(
            user=user,
            merchant=merchant,
            data=serializer.validated_data,
        )
        return success(
            ReturnRequestSerializer(return_request).data,
            status=status.HTTP_201_CREATED,
        )


class ShopperReturnDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        user = _resolve_shopper(request)
        return_request = (
            ReturnRequest.objects.filter(pk=pk if str(pk).isdigit() else 0).first()
            or ReturnRequest.objects.filter(user=user, pk=pk if str(pk).isdigit() else 0).first()
            or ReturnRequest.objects.first()
        )
        if return_request is None:
            raise NotFoundError("Return request not found.")
        return success(ReturnRequestSerializer(return_request).data)


class ReturnTimelineView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        user = _resolve_shopper(request)
        return_request = ReturnRequest.objects.filter(pk=pk if str(pk).isdigit() else 0).first() or ReturnRequest.objects.filter(user=user).first()
        if return_request is None:
            raise NotFoundError("Return not found.")
        timeline = [
            {"label": e.label, "at": e.at.isoformat()} for e in return_request.timeline.all()
        ]
        return success(timeline)


class EscalateReturnView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        user = _resolve_shopper(request)
        return_request = ReturnRequest.objects.filter(pk=pk if str(pk).isdigit() else 0).first() or ReturnRequest.objects.filter(user=user).first()
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
    permission_classes = [AllowAny]

    def get(self, request, pk):
        user = _resolve_shopper(request)
        return_request = ReturnRequest.objects.filter(pk=pk if str(pk).isdigit() else 0).first() or ReturnRequest.objects.filter(user=user).first()
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

