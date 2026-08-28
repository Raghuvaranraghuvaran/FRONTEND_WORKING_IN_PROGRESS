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


class ProductVerificationView(APIView):
    """Agent/warehouse endpoint to submit Type B product verification data.

    POST /api/returns/{pk}/verify-product/

    Accepts: serial number, IMEI, condition, packaging, accessories, quantity,
    product swap flag, notes, and verification images.

    On submission:
    1. Updates the ReturnRequest with verification data
    2. Checks for serial/IMEI mismatch against the original order item
    3. Identifies missing accessories
    4. Re-runs Type B risk signals
    5. Updates risk score and tier
    """
    permission_classes = [AllowAny]

    def post(self, request, pk):
        from .serializers import ProductVerificationSerializer
        from fraud.services.risk_engine import RiskEngine
        from fraud.services.decision_engine import DecisionEngine
        from fraud.services import signal_extractors
        from .models import ReturnEvent

        return_request = ReturnRequest.objects.select_related(
            "order", "user", "merchant"
        ).filter(pk=pk if str(pk).isdigit() else 0).first()

        if return_request is None:
            raise NotFoundError("Return not found.")

        serializer = ProductVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Get the order item for serial/IMEI comparison
        order_item = return_request.order.items.select_related("product").first()

        # ── Update verification fields on ReturnRequest ──
        return_request.returned_serial_number = data.get("returned_serial_number", "")
        return_request.returned_imei_number = data.get("returned_imei_number", "")
        return_request.product_condition = data.get("product_condition", "unknown")
        return_request.packaging_condition = data.get("packaging_condition", "not_inspected")
        return_request.accessories_returned = data.get("accessories_returned", [])
        return_request.is_product_swap_detected = data.get("is_product_swap_detected", False)
        return_request.swap_details = data.get("swap_details", "")
        return_request.verification_notes = data.get("verification_notes", "")
        return_request.verification_images = data.get("verification_images", [])

        qty_received = data.get("quantity_received")
        if qty_received is not None:
            return_request.quantity_received = qty_received

        # Set verified metadata
        return_request.verified_at = timezone.now()
        actor = request.user.email if (request.user and request.user.is_authenticated) else "agent@returnguard.in"
        return_request.verified_by = actor

        # ── Check serial/IMEI mismatch ──
        if order_item:
            orig_serial = getattr(order_item, "serial_number", "") or ""
            ret_serial = return_request.returned_serial_number or ""
            if orig_serial and ret_serial and orig_serial.strip().upper() != ret_serial.strip().upper():
                return_request.serial_mismatch = True

            orig_imei = getattr(order_item, "imei_number", "") or ""
            ret_imei = return_request.returned_imei_number or ""
            if orig_imei and ret_imei and orig_imei.strip() != ret_imei.strip():
                return_request.imei_mismatch = True

        # ── Identify missing accessories ──
        expected = return_request.accessories_expected or []
        returned = return_request.accessories_returned or []
        returned_lower = [a.lower().strip() for a in returned]
        missing = [a for a in expected if a.lower().strip() not in returned_lower]
        return_request.accessories_missing = missing

        # ── Re-run Type B signals for re-scoring ──
        type_b_score = 0
        type_b_signals = []

        d, s = signal_extractors.serial_imei_mismatch_signals(
            return_request=return_request, order_item=order_item
        )
        type_b_score += d
        type_b_signals.extend(s)

        d, s = signal_extractors.product_swap_signals(return_request=return_request)
        type_b_score += d
        type_b_signals.extend(s)

        d, s = signal_extractors.product_condition_signals(return_request=return_request)
        type_b_score += d
        type_b_signals.extend(s)

        d, s = signal_extractors.packaging_mismatch_signals(return_request=return_request)
        type_b_score += d
        type_b_signals.extend(s)

        d, s = signal_extractors.missing_accessories_signals(return_request=return_request)
        type_b_score += d
        type_b_signals.extend(s)

        d, s = signal_extractors.quantity_mismatch_signals(return_request=return_request)
        type_b_score += d
        type_b_signals.extend(s)

        # ── Update risk score ──
        # Combine original Type C score with new Type B score
        original_score = return_request.risk_score or 0
        new_score = min(100, original_score + type_b_score)

        # Determine new tier
        engine = RiskEngine()
        new_tier = engine.tier_for_score(new_score)
        decision_engine = DecisionEngine()
        decision = decision_engine.decide(new_tier)

        return_request.risk_score = new_score
        return_request.risk_tier = new_tier

        # Update signals
        existing_signals = return_request.signals or []
        return_request.signals = existing_signals + type_b_signals

        # Update checkpoint signals
        existing_checkpoints = return_request.checkpoint_signals or []
        verification_checkpoints = [
            {"id": "CP17b_V", "name": "Serial/IMEI Verification", "tier_type": "B",
             "score_delta": type_b_score, "signals": type_b_signals,
             "severity": "critical" if type_b_score >= 40 else "high" if type_b_score >= 15 else "pass"},
        ]
        return_request.checkpoint_signals = existing_checkpoints + verification_checkpoints

        # Update status based on new tier
        if new_tier == "Critical":
            return_request.status = "hold"
            return_request.verification_status = "Failed"
        elif new_tier == "High":
            return_request.status = "manual_review"
            return_request.verification_status = "Flagged"
        elif type_b_score == 0:
            return_request.verification_status = "Passed"
            if return_request.status == "hold":
                return_request.status = "manual_review"
        else:
            return_request.verification_status = "Flagged"

        return_request.verification_method = "agent_verified"

        return_request.save()

        # Create timeline events
        ReturnEvent.objects.create(
            return_request=return_request,
            label=f"Product verified by {actor}"
        )
        if return_request.serial_mismatch or return_request.imei_mismatch:
            ReturnEvent.objects.create(
                return_request=return_request,
                label="⚠️ Serial/IMEI mismatch detected"
            )
        if return_request.is_product_swap_detected:
            ReturnEvent.objects.create(
                return_request=return_request,
                label="⚠️ Product swap detected"
            )
        if missing:
            ReturnEvent.objects.create(
                return_request=return_request,
                label=f"Missing accessories: {', '.join(missing)}"
            )

        return success({
            "id": return_request.id,
            "verification_status": return_request.verification_status,
            "risk_score": return_request.risk_score,
            "risk_tier": return_request.risk_tier,
            "serial_mismatch": return_request.serial_mismatch,
            "imei_mismatch": return_request.imei_mismatch,
            "accessories_missing": return_request.accessories_missing,
            "is_product_swap_detected": return_request.is_product_swap_detected,
            "product_condition": return_request.product_condition,
            "packaging_condition": return_request.packaging_condition,
            "type_b_signals": type_b_signals,
            "type_b_score": type_b_score,
            "decision": decision,
            "message": "Product verification completed. Risk score updated.",
        })


