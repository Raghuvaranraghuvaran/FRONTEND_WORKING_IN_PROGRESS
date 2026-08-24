"""Restriction Engine (RG Architecture Section 8).

Manages customer-level restrictions applied by merchants or the system.

Restriction levels from the PDF:
    Soft        → COD limit, order-value limit, quantity/variant limit
    Verification → OTP, address verification, prepaid requirement
    Review      → Manual approval, return proof, photo/video evidence
    Strong      → Temporary COD suspension, temporary account restriction

Public API:
    apply_restriction(...)   → creates a new CustomerRestriction
    remove_restriction(...)  → marks a restriction as removed
    get_active(...)          → returns active restrictions for a customer
    check_order(...)         → validates a new order against restrictions
"""

from django.utils import timezone

from fraud.models import CustomerRestriction, CustomerRiskProfile
from audit.services import log_action


def apply_restriction(*, customer, merchant, restriction_type, reason="",
                       threshold_value=None, applied_by="system"):
    """Create a new active restriction for a customer."""
    restriction = CustomerRestriction.objects.create(
        merchant=merchant,
        customer=customer,
        restriction_type=restriction_type,
        reason=reason,
        threshold_value=threshold_value,
        applied_by=applied_by,
        status="active",
    )

    # Bump the customer's restriction_count on their risk profile
    profile, _ = CustomerRiskProfile.objects.get_or_create(
        merchant=merchant, customer=customer
    )
    profile.restriction_count = CustomerRestriction.objects.filter(
        merchant=merchant, customer=customer
    ).count()
    profile.save(update_fields=["restriction_count"])

    # Audit
    log_action(
        merchant=merchant,
        actor=applied_by,
        action="restriction_applied",
        target=f"{customer.email}",
        notes=f"{restriction_type}: {reason}",
    )

    return restriction


def remove_restriction(*, restriction_id, removed_by="merchant"):
    """Deactivate a restriction and record who removed it."""
    try:
        restriction = CustomerRestriction.objects.get(id=restriction_id, status="active")
    except CustomerRestriction.DoesNotExist:
        return None

    restriction.status = "removed"
    restriction.removed_by = removed_by
    restriction.end_date = timezone.now()
    restriction.save(update_fields=["status", "removed_by", "end_date"])

    # Update count
    profile = CustomerRiskProfile.objects.filter(
        merchant=restriction.merchant, customer=restriction.customer
    ).first()
    if profile:
        profile.restriction_count = CustomerRestriction.objects.filter(
            merchant=restriction.merchant,
            customer=restriction.customer,
            status="active",
        ).count()
        profile.save(update_fields=["restriction_count"])

    log_action(
        merchant=restriction.merchant,
        actor=removed_by,
        action="restriction_removed",
        target=f"{restriction.customer.email}",
        notes=f"{restriction.restriction_type} removed",
    )

    return restriction


def get_active(*, customer, merchant):
    """Return all active restrictions for a customer under a merchant."""
    return list(
        CustomerRestriction.objects.filter(
            merchant=merchant,
            customer=customer,
            status="active",
        ).order_by("-created_at")
    )


def get_history(*, customer, merchant):
    """Return the full restriction history (all statuses)."""
    return list(
        CustomerRestriction.objects.filter(
            merchant=merchant,
            customer=customer,
        ).order_by("-created_at")
    )


def check_order(*, customer, merchant, payment_method="", order_total=0, variant_count=1):
    """Validate a new order against the customer's active restrictions.

    Returns a dict with:
        allowed: bool
        violations: list of reasons the order is blocked
    """
    active = get_active(customer=customer, merchant=merchant)
    violations = []

    for r in active:
        rtype = r.restriction_type

        if rtype == "account_restricted":
            violations.append("Account is temporarily restricted")

        elif rtype == "cod_suspended" and payment_method == "COD":
            violations.append("COD is suspended for this customer")

        elif rtype == "prepaid_only" and payment_method == "COD":
            violations.append("Customer must use prepaid payment")

        elif rtype == "cod_limit" and payment_method == "COD":
            if r.threshold_value and order_total > float(r.threshold_value):
                violations.append(
                    f"COD order exceeds limit of {r.threshold_value}"
                )

        elif rtype == "order_value_limit":
            if r.threshold_value and order_total > float(r.threshold_value):
                violations.append(
                    f"Order value exceeds limit of {r.threshold_value}"
                )

        elif rtype == "high_value_restricted":
            if r.threshold_value and order_total > float(r.threshold_value):
                violations.append("High-value orders are restricted")

        elif rtype == "variant_limit":
            if r.threshold_value and variant_count > int(r.threshold_value):
                violations.append(
                    f"Variant count {variant_count} exceeds limit of {int(r.threshold_value)}"
                )

    return {
        "allowed": len(violations) == 0,
        "violations": violations,
    }
