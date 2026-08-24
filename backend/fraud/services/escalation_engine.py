"""Escalation Engine (RG Architecture Section 6 & 7).

Implements progressive escalation for repeat offenders.

Escalation ladder from the PDF:
    Level 0 → Normal ordering
    Level 1 → Warning / OTP verification
    Level 2 → COD restricted
    Level 3 → Prepaid only + Manual review
    Level 4 → Temporary account restriction
    Level 5 → Merchant final review / permanent block

IMPORTANT: A return itself should NOT automatically count as abuse.
Escalation is based on repeated suspicious patterns and confirmed violations.

Escalation rule:
    Confirmed violation → Increase escalation level → Apply corresponding
    restriction → Record action → Monitor future behavior → De-escalate
    or escalate based on new evidence.
"""

from django.utils import timezone

from fraud.models import CustomerRiskProfile, EscalationHistory
from fraud.services import restriction_engine
from audit.services import log_action


# Maps escalation levels to the restrictions they should impose
LEVEL_RESTRICTIONS = {
    0: [],                                  # Normal
    1: [],                                  # Warning / verification (no hard restrictions)
    2: [("cod_suspended", "COD restricted due to escalation")],
    3: [
        ("prepaid_only", "Prepaid required due to escalation level 3"),
    ],
    4: [
        ("prepaid_only", "Prepaid required due to escalation level 4"),
        ("account_restricted", "Temporary account restriction"),
    ],
    5: [
        ("account_restricted", "Merchant final review — account restricted"),
    ],
}


def escalate(*, customer, merchant, trigger_event, applied_by="system"):
    """Increase the customer's escalation level by 1 (capped at 5).

    Applies the corresponding restrictions for the new level and records
    the transition in EscalationHistory.
    """
    profile, _ = CustomerRiskProfile.objects.get_or_create(
        merchant=merchant, customer=customer
    )
    previous_level = profile.escalation_level
    new_level = min(previous_level + 1, 5)

    if new_level == previous_level:
        # Already at max
        return profile, None

    # Update profile
    profile.escalation_level = new_level
    profile.confirmed_violations += 1
    profile.save(update_fields=["escalation_level", "confirmed_violations"])

    # Record history
    history = EscalationHistory.objects.create(
        merchant=merchant,
        customer=customer,
        previous_level=previous_level,
        new_level=new_level,
        trigger_event=trigger_event,
    )

    # Apply restrictions for the new level
    restrictions_to_apply = LEVEL_RESTRICTIONS.get(new_level, [])
    for rtype, reason in restrictions_to_apply:
        # Avoid duplicates: only apply if not already active
        existing = restriction_engine.get_active(customer=customer, merchant=merchant)
        already_has = any(r.restriction_type == rtype for r in existing)
        if not already_has:
            restriction_engine.apply_restriction(
                customer=customer,
                merchant=merchant,
                restriction_type=rtype,
                reason=reason,
                applied_by=applied_by,
            )

    # Audit
    log_action(
        merchant=merchant,
        actor=applied_by,
        action="escalated",
        target=f"{customer.email}",
        notes=f"L{previous_level}→L{new_level}: {trigger_event}",
    )

    return profile, history


def de_escalate(*, customer, merchant, reason="", removed_by="merchant"):
    """Decrease the customer's escalation level by 1 (min 0).

    Removes restrictions that were applied at the previous level.
    """
    profile = CustomerRiskProfile.objects.filter(
        merchant=merchant, customer=customer
    ).first()
    if not profile or profile.escalation_level == 0:
        return profile, None

    previous_level = profile.escalation_level
    new_level = max(previous_level - 1, 0)

    profile.escalation_level = new_level
    profile.save(update_fields=["escalation_level"])

    # Record history
    history = EscalationHistory.objects.create(
        merchant=merchant,
        customer=customer,
        previous_level=previous_level,
        new_level=new_level,
        trigger_event=f"De-escalation: {reason}",
    )

    # Remove restrictions that belong to the old level but not the new one
    old_types = {r[0] for r in LEVEL_RESTRICTIONS.get(previous_level, [])}
    new_types = {r[0] for r in LEVEL_RESTRICTIONS.get(new_level, [])}
    types_to_remove = old_types - new_types

    if types_to_remove:
        from fraud.models import CustomerRestriction
        active = CustomerRestriction.objects.filter(
            merchant=merchant,
            customer=customer,
            status="active",
            restriction_type__in=types_to_remove,
        )
        for r in active:
            restriction_engine.remove_restriction(
                restriction_id=r.id,
                removed_by=removed_by,
            )

    log_action(
        merchant=merchant,
        actor=removed_by,
        action="de_escalated",
        target=f"{customer.email}",
        notes=f"L{previous_level}→L{new_level}: {reason}",
    )

    return profile, history


def get_recommended_action(escalation_level):
    """Return the recommended restriction set for a given escalation level.

    From PDF Section 6:
        1st incident → Warning / Verification
        2nd incident → COD Restriction
        3rd incident → Prepaid Only + Manual Review
        4th incident → Merchant Review
        Repeated abuse → Temporary Account Suspension
        Further → Merchant Final Review → Continue Restriction / Permanent Block
    """
    actions = {
        0: {"action": "normal", "label": "Normal ordering", "restrictions": []},
        1: {"action": "verify", "label": "Warning / OTP verification", "restrictions": []},
        2: {"action": "restrict_cod", "label": "COD restricted", "restrictions": ["cod_suspended"]},
        3: {
            "action": "require_prepaid",
            "label": "Prepaid only + Manual review",
            "restrictions": ["prepaid_only"],
        },
        4: {
            "action": "suspend_account",
            "label": "Temporary account restriction",
            "restrictions": ["prepaid_only", "account_restricted"],
        },
        5: {
            "action": "merchant_review",
            "label": "Merchant final review — continue restriction or permanent block",
            "restrictions": ["account_restricted"],
        },
    }
    return actions.get(escalation_level, actions[0])


def get_escalation_history(*, customer, merchant):
    """Return the full escalation timeline for a customer."""
    return list(
        EscalationHistory.objects.filter(
            merchant=merchant,
            customer=customer,
        ).order_by("-created_at")
    )
