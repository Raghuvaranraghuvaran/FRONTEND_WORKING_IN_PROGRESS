"""Fraud API views (RG Architecture Sections 5, 9, 10).

Provides the backend for:
- Customer review screen (Section 10)
- Merchant action processing (Section 5)
- Restriction management (Section 8)
- Escalation history (Section 7)
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.shortcuts import get_object_or_404

from accounts.models import User, ShopperProfile
from common.tenancy import require_merchant_context
from fraud.models import (
    CustomerRestriction,
    CustomerRiskProfile,
    EscalationHistory,
    FraudConfiguration,
    RiskScoreEvent,
)
from fraud.serializers import (
    CustomerRestrictionSerializer,
    CustomerRiskProfileSerializer,
    EscalationHistorySerializer,
    MerchantActionSerializer,
    RiskScoreEventSerializer,
)
from fraud.services.decision_engine import DecisionEngine
from fraud.services.risk_engine import RiskEngine
from fraud.services import restriction_engine, escalation_engine
from audit.services import log_action


# ──────────────────────────────────────────────────────────
# Customer Review — PDF Section 10
# ──────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_review(request, customer_id):
    """Assemble the full customer review screen data.

    Returns: risk profile, behavior metrics, scoring events,
    active restrictions, escalation history, and decision recommendation.
    """
    merchant = require_merchant_context(request)
    customer = get_object_or_404(User, id=customer_id)

    # Risk profile
    profile, _ = CustomerRiskProfile.objects.get_or_create(
        merchant=merchant, customer=customer
    )

    # Behavior metrics from ShopperProfile
    shopper = ShopperProfile.objects.filter(user=customer, merchant=merchant).first()
    behavior = {}
    if shopper:
        behavior = {
            "total_orders": shopper.total_orders,
            "total_returns": shopper.total_returns,
            "total_cod_refusals": shopper.total_cod_refusals,
            "successful_deliveries": shopper.successful_deliveries,
            "multiple_variant_orders": shopper.multiple_variant_orders,
            "high_value_cod_count": shopper.high_value_cod_count,
            "address_mismatch_count": shopper.address_mismatch_count,
            "return_rate": round(
                (shopper.total_returns / shopper.total_orders) if shopper.total_orders else 0,
                2,
            ),
        }

    # Scoring history
    scoring = RiskScoreEvent.objects.filter(
        merchant=merchant, customer=customer
    ).order_by("-created_at")[:10]

    # Active restrictions
    restrictions = CustomerRestriction.objects.filter(
        merchant=merchant, customer=customer
    ).order_by("-created_at")

    # Escalation history
    esc_history = EscalationHistory.objects.filter(
        merchant=merchant, customer=customer
    ).order_by("-created_at")

    # Decision recommendation
    engine = DecisionEngine()
    decision = engine.decide(profile.risk_tier, profile.escalation_level)

    data = {
        "profile": CustomerRiskProfileSerializer(profile).data,
        "behavior": behavior,
        "scoring": RiskScoreEventSerializer(scoring, many=True).data,
        "restrictions": CustomerRestrictionSerializer(restrictions, many=True).data,
        "escalation_history": EscalationHistorySerializer(esc_history, many=True).data,
        "decision": decision,
    }
    return Response(data)


# ──────────────────────────────────────────────────────────
# Merchant Action — PDF Section 5
# ──────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def merchant_action(request, customer_id):
    """Process a merchant decision for a customer.

    Available actions: accept, reject, verify, restrict_cod,
    restrict_high_value, require_prepaid, manual_review,
    increase_restriction, remove_restriction, suspend_account.
    """
    merchant = require_merchant_context(request)
    customer = get_object_or_404(User, id=customer_id)
    serializer = MerchantActionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    action = serializer.validated_data["action"]
    notes = serializer.validated_data.get("notes", "")
    threshold = serializer.validated_data.get("threshold_value")
    actor = request.user.email

    result = {"action": action, "status": "completed"}

    # Map actions to operations
    if action == "accept":
        log_action(merchant=merchant, actor=actor, action="order_accepted",
                   target=customer.email, notes=notes)

    elif action == "reject":
        log_action(merchant=merchant, actor=actor, action="order_rejected",
                   target=customer.email, notes=notes)

    elif action == "verify":
        log_action(merchant=merchant, actor=actor, action="verification_requested",
                   target=customer.email, notes=notes)
        result["requires_otp"] = True

    elif action == "restrict_cod":
        restriction_engine.apply_restriction(
            customer=customer, merchant=merchant,
            restriction_type="cod_suspended",
            reason=notes or "COD restricted by merchant",
            threshold_value=threshold,
            applied_by=actor,
        )

    elif action == "restrict_high_value":
        restriction_engine.apply_restriction(
            customer=customer, merchant=merchant,
            restriction_type="high_value_restricted",
            reason=notes or "High-value orders restricted",
            threshold_value=threshold or 5000,
            applied_by=actor,
        )

    elif action == "require_prepaid":
        restriction_engine.apply_restriction(
            customer=customer, merchant=merchant,
            restriction_type="prepaid_only",
            reason=notes or "Prepaid required by merchant",
            applied_by=actor,
        )

    elif action == "manual_review":
        log_action(merchant=merchant, actor=actor, action="sent_to_review",
                   target=customer.email, notes=notes)

    elif action == "increase_restriction":
        profile, history = escalation_engine.escalate(
            customer=customer, merchant=merchant,
            trigger_event=notes or "Merchant escalation",
            applied_by=actor,
        )
        if profile:
            result["new_escalation_level"] = profile.escalation_level

    elif action == "remove_restriction":
        rid = serializer.validated_data.get("restriction_id")
        if rid:
            restriction_engine.remove_restriction(
                restriction_id=rid, removed_by=actor
            )
        else:
            result["error"] = "restriction_id is required"
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

    elif action == "suspend_account":
        restriction_engine.apply_restriction(
            customer=customer, merchant=merchant,
            restriction_type="account_restricted",
            reason=notes or "Account suspended by merchant",
            applied_by=actor,
        )
        escalation_engine.escalate(
            customer=customer, merchant=merchant,
            trigger_event="Account suspended by merchant",
            applied_by=actor,
        )

    return Response(result)


# ──────────────────────────────────────────────────────────
# Restriction & Escalation APIs
# ──────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def restriction_list(request, customer_id):
    """List all restrictions (active + historical) for a customer."""
    merchant = require_merchant_context(request)
    customer = get_object_or_404(User, id=customer_id)
    restrictions = CustomerRestriction.objects.filter(
        merchant=merchant, customer=customer
    ).order_by("-created_at")
    return Response(CustomerRestrictionSerializer(restrictions, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def escalation_history_list(request, customer_id):
    """List escalation history for a customer."""
    merchant = require_merchant_context(request)
    customer = get_object_or_404(User, id=customer_id)
    history = EscalationHistory.objects.filter(
        merchant=merchant, customer=customer
    ).order_by("-created_at")
    return Response(EscalationHistorySerializer(history, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def escalate_customer(request, customer_id):
    """Manually escalate a customer's level."""
    merchant = require_merchant_context(request)
    customer = get_object_or_404(User, id=customer_id)
    trigger = request.data.get("trigger_event", "Manual escalation")

    profile, history = escalation_engine.escalate(
        customer=customer, merchant=merchant,
        trigger_event=trigger, applied_by=request.user.email,
    )
    if history:
        return Response(EscalationHistorySerializer(history).data)
    return Response({"detail": "Already at maximum escalation level."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def de_escalate_customer(request, customer_id):
    """Manually de-escalate a customer's level."""
    merchant = require_merchant_context(request)
    customer = get_object_or_404(User, id=customer_id)
    reason = request.data.get("reason", "Merchant de-escalation")

    profile, history = escalation_engine.de_escalate(
        customer=customer, merchant=merchant,
        reason=reason, removed_by=request.user.email,
    )
    if history:
        return Response(EscalationHistorySerializer(history).data)
    return Response({"detail": "Already at level 0."})
