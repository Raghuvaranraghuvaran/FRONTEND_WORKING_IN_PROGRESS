"""Extract structured fraud signals from domain objects.

Implements ALL 28 risk checkpoints from the Return Guard — Risk Checkpoints PDF,
organized into the 4-tier architecture:

  Type A — Eligibility Checks (pre-scoring gate)
  Type B — Product Verification Signals (physical item checks)
  Type C — Customer Behavior Signals (historical patterns)

Each extractor returns (score_delta, signals_list).
"""

from datetime import datetime, timedelta
from decimal import Decimal

# ──────────────────────────────────────────────────────────
# Default weights from the PDF (Section 4 — Risk Scoring)
# These are overridden by merchant-level FraudConfiguration.
# ──────────────────────────────────────────────────────────
DEFAULT_WEIGHTS = {
    "cod_refusal": 25,
    "return_frequency": 20,
    "multiple_variants": 15,
    "high_value_cod": 10,
    "seasonal_signal": 10,
    "address_mismatch": 10,
    "device_reuse": 22,
    "escalation_bonus": 8,
    # New checkpoint weights
    "size_exchange": 15,
    "wardrobing": 30,
    "high_value_return": 15,
    "immediate_return": 10,
    "deadline_return": 10,
    "same_product_return": 15,
    "damage_claim": 25,
    "damage_no_evidence": 20,
    "reason_inconsistency": 15,
    "multi_account": 30,
    "refund_ratio": 25,
    "rejected_return": 25,
    "unusual_quantity": 30,
    "duplicate_return": 20,
    "serial_mismatch": 50,
    "missing_accessories": 15,
    "product_condition": 20,
    "packaging_mismatch": 20,
    "product_swap": 50,
    "quantity_mismatch": 20,
    "open_box_claim": 15,
    "customer_tenure": 8,
}

REASON_WEIGHTS = {
    "changed_mind": 12,
    "wrong_size": 4,
    "damaged": 2,
    "wrong_product": 6,
    "missing_item": 4,
    "quality": 5,
    "not_as_described": 8,
    "other": 10,
}

# Categories considered seasonal / wardrobing-prone
SEASONAL_CATEGORIES = {"cat_ethnic"}

# High-value COD threshold (in currency units)
HIGH_VALUE_COD_THRESHOLD = 5000


def _weight(key, config_weights=None):
    """Retrieve a weight, preferring merchant-specific overrides."""
    if config_weights and key in config_weights:
        return config_weights[key]
    return DEFAULT_WEIGHTS.get(key, 0)


# ══════════════════════════════════════════════════════════
# TYPE A — ELIGIBILITY CHECKS (Pre-scoring gate)
# ══════════════════════════════════════════════════════════

def check_return_eligibility(*, order=None, order_item=None, category=None,
                              return_type="REFUND", replacement_count=0):
    """CP26: Check whether the return is even eligible before scoring.

    Returns:
        eligible: bool
        reasons: list of rejection reasons (empty if eligible)
    """
    reasons = []

    # Check category-level policy
    if category:
        if getattr(category, "non_returnable", False):
            reasons.append("This product category is non-returnable.")

        if return_type == "REFUND" and not getattr(category, "refund_allowed", True):
            reasons.append("Refunds are not allowed for this category.")

        if return_type == "REPLACEMENT" and not getattr(category, "replacement_allowed", True):
            reasons.append("Replacements are not available for this category.")

        if return_type == "EXCHANGE" and not getattr(category, "exchange_allowed", True):
            reasons.append("Exchanges are not available for this category.")

    # Check product-level returnability
    if order_item and order_item.product:
        product = order_item.product
        if not getattr(product, "is_returnable", True):
            reasons.append("This product is marked as non-returnable / final sale.")

    if order_item and getattr(order_item, "is_final_sale", False):
        reasons.append("This item was sold as final sale (non-returnable).")

    # Check return window
    if order and category:
        delivered_at = getattr(order, "delivered_at", None)
        if delivered_at:
            try:
                from django.utils import timezone
                window_days = getattr(category, "return_window_days", 7) or 7
                now = timezone.now()
                delta = now - delivered_at
                if delta.days > window_days:
                    reasons.append(
                        f"Return window expired ({delta.days} days since delivery, "
                        f"policy allows {window_days} days)."
                    )
            except Exception:
                pass

    # CP24: Check replacement limit
    if return_type == "REPLACEMENT":
        max_replacements = getattr(category, "max_replacements", 1) if category else 1
        if replacement_count >= max_replacements:
            reasons.append(
                f"Maximum replacements ({max_replacements}) already used for this order."
            )

    return len(reasons) == 0, reasons


# ══════════════════════════════════════════════════════════
# TYPE B — PRODUCT VERIFICATION SIGNALS
# ══════════════════════════════════════════════════════════

def serial_imei_mismatch_signals(return_request=None, order_item=None, config_weights=None):
    """CP17b: Compare outbound serial/IMEI with returned serial/IMEI.

    This is a HIGH/CRITICAL risk signal — the #1 priority checkpoint.
    """
    signals = []
    delta = 0

    if not return_request or not order_item:
        return 0, []

    # Serial number check
    original_serial = getattr(order_item, "serial_number", "") or ""
    returned_serial = getattr(return_request, "returned_serial_number", "") or ""

    if original_serial and returned_serial:
        if original_serial.strip().upper() != returned_serial.strip().upper():
            delta += _weight("serial_mismatch", config_weights)
            signals.append(
                f"⚠️ CRITICAL: Serial number mismatch — "
                f"shipped '{original_serial}', returned '{returned_serial}'"
            )

    # IMEI number check
    original_imei = getattr(order_item, "imei_number", "") or ""
    returned_imei = getattr(return_request, "returned_imei_number", "") or ""

    if original_imei and returned_imei:
        if original_imei.strip() != returned_imei.strip():
            delta += _weight("serial_mismatch", config_weights)
            signals.append(
                f"⚠️ CRITICAL: IMEI mismatch — "
                f"shipped '{original_imei}', returned '{returned_imei}'"
            )

    return delta, signals


def missing_accessories_signals(return_request=None, config_weights=None):
    """CP18: Check whether returned package contains all originally shipped accessories."""
    if not return_request:
        return 0, []

    missing = getattr(return_request, "accessories_missing", None) or []
    expected = getattr(return_request, "accessories_expected", None) or []

    if not missing:
        return 0, []

    delta = 0
    signals = []
    missing_count = len(missing)
    total_expected = len(expected) if expected else missing_count + 1

    ratio = missing_count / total_expected if total_expected > 0 else 0

    if ratio > 0.5:
        # Major — most accessories missing
        delta += _weight("missing_accessories", config_weights)
        signals.append(f"Major accessories missing: {', '.join(missing)} ({missing_count}/{total_expected})")
    elif missing_count > 0:
        # Minor
        delta += _weight("missing_accessories", config_weights) * 0.5
        signals.append(f"Minor accessories missing: {', '.join(missing)}")

    return delta, signals


def product_condition_signals(return_request=None, config_weights=None):
    """CP19: Evaluate product condition — UNUSED / USED / DAMAGED / SOILED / TAMPERED."""
    if not return_request:
        return 0, []

    condition = getattr(return_request, "product_condition", "unknown") or "unknown"
    shopper_condition = getattr(return_request, "shopper_reported_condition", "unknown") or "unknown"

    signals = []
    delta = 0

    condition_scores = {
        "unused": 0,
        "used": 10,
        "damaged": 5,
        "soiled": 15,
        "tampered": 20,
        "tag_removed": 12,
        "unknown": 0,
    }

    score = condition_scores.get(condition, 0)
    if score > 0:
        delta += score
        label = condition.replace("_", " ").title()
        signals.append(f"Product condition: {label}")

    # Check for discrepancy between shopper claim and verified condition
    if (shopper_condition != "unknown" and condition != "unknown"
            and shopper_condition != condition):
        delta += 10
        signals.append(
            f"Condition mismatch — shopper claimed '{shopper_condition}', "
            f"verified as '{condition}'"
        )

    return delta, signals


def packaging_mismatch_signals(return_request=None, config_weights=None):
    """CP20: Check original vs returned packaging condition."""
    if not return_request:
        return 0, []

    packaging = getattr(return_request, "packaging_condition", "not_inspected") or "not_inspected"

    packaging_scores = {
        "original_intact": 0,
        "original_damaged": 5,
        "different_box": 20,
        "no_packaging": 15,
        "not_inspected": 0,
    }

    score = packaging_scores.get(packaging, 0)
    if score > 0:
        label = packaging.replace("_", " ").title()
        return score, [f"Packaging issue: {label}"]

    return 0, []


def product_swap_signals(return_request=None, config_weights=None):
    """CP21: Detect if a different/cheaper/older item was returned instead of original."""
    if not return_request:
        return 0, []

    if getattr(return_request, "is_product_swap_detected", False):
        details = getattr(return_request, "swap_details", "") or "Product swap detected"
        return _weight("product_swap", config_weights), [
            f"⚠️ CRITICAL: Wrong item returned — {details}"
        ]

    return 0, []


def quantity_mismatch_signals(return_request=None, config_weights=None):
    """CP22: Check if claimed return quantity matches actually received quantity."""
    if not return_request:
        return 0, []

    claimed = getattr(return_request, "quantity_claimed", 1) or 1
    received = getattr(return_request, "quantity_received", None)

    if received is not None and received < claimed:
        missing = claimed - received
        return _weight("quantity_mismatch", config_weights), [
            f"Quantity mismatch — claimed {claimed}, received {received} ({missing} missing)"
        ]

    return 0, []


# ══════════════════════════════════════════════════════════
# TYPE C — CUSTOMER BEHAVIOR SIGNALS
# ══════════════════════════════════════════════════════════

def shopper_signals(shopper_profile, config_weights=None):
    """Return (base_score_delta, signals) from a shopper's history."""
    signals = []
    delta = 0

    orders = shopper_profile.total_orders or 0
    returns = shopper_profile.total_returns or 0
    return_rate = (returns / orders) if orders else 0

    # Return frequency scoring (up to 20 pts from PDF)
    if return_rate > 0.4:
        delta += _weight("return_frequency", config_weights)
        signals.append("High return frequency")
    elif return_rate > 0.2:
        delta += _weight("return_frequency", config_weights) * 0.6
        signals.append("Elevated return frequency")
    else:
        delta -= 5
        signals.append("Low return frequency")

    # COD refusal scoring (up to 25 pts from PDF)
    cod_refusals = getattr(shopper_profile, "total_cod_refusals", 0) or 0
    if cod_refusals >= 3:
        delta += _weight("cod_refusal", config_weights)
        signals.append("Repeated COD refusals")
    elif cod_refusals >= 1:
        delta += _weight("cod_refusal", config_weights) * 0.5
        signals.append("COD refusal history")

    # Device reuse
    if getattr(shopper_profile, "device_reuse_flag", False):
        delta += _weight("device_reuse", config_weights)
        signals.append("Device reuse")

    # Known-good customer bonus
    if getattr(shopper_profile, "risk_tier", "Low") == "Low" and orders >= 5 and return_rate < 0.15:
        delta -= 8
        signals.append("Known low-risk customer")

    return delta, signals


def size_exchange_signals(shopper_profile=None, variant_count=1, config_weights=None):
    """CP1: Frequent Size Exchanges + CP2: Multiple Sizes in One Order + CP3: Repeated Size Switching."""
    signals = []
    delta = 0

    # CP1: Frequent size exchanges
    if shopper_profile:
        exchanges = getattr(shopper_profile, "size_exchange_count", 0) or 0
        orders = shopper_profile.total_orders or 1

        exchange_rate = exchanges / orders
        if exchange_rate > 0.5:
            delta += 15
            signals.append("Extreme size exchange pattern")
        elif exchange_rate > 0.3:
            delta += 10
            signals.append("Very frequent size exchanges")
        elif exchange_rate > 0.15:
            delta += 5
            signals.append("Repeated size exchanges")

    # CP2: Multiple sizes in one order (bracketing)
    if variant_count >= 4:
        delta += 10
        signals.append("Multiple sizes ordered (4+ variants — bracketing pattern)")
    elif variant_count == 3:
        delta += 5
        signals.append("Multiple sizes ordered (3 variants)")

    return delta, signals


def wardrobing_signals(shopper_profile=None, reason=None, category_slug=None,
                        order_date=None, return_request=None, config_weights=None):
    """CP4: Wardrobing pattern detection.

    Identifies patterns: premium clothing + delayed return + 'changed mind' reason.
    """
    signals = []
    delta = 0

    if not shopper_profile:
        return 0, []

    # Check for wardrobing indicators
    indicators = 0

    # Premium fashion category
    fashion_categories = {"cat_ethnic", "cat_daily"}
    if category_slug and category_slug in fashion_categories:
        indicators += 1

    # "Changed mind" reason
    if reason and reason.lower() in ("changed_mind", "changed mind", "not needed"):
        indicators += 1

    # High return count in fashion
    returns = shopper_profile.total_returns or 0
    if returns >= 5:
        indicators += 1

    # Previous condition issues (used/soiled returns)
    damage_claims = getattr(shopper_profile, "damage_claim_count", 0) or 0
    if damage_claims >= 2:
        indicators += 1

    # Score based on accumulated indicators
    if indicators >= 4:
        delta += 35
        signals.append("Strong wardrobing pattern detected — previous condition issues")
    elif indicators >= 3:
        delta += 30
        signals.append("Repeated wardrobing pattern detected")
    elif indicators >= 2:
        delta += 20
        signals.append("Potential wardrobing pattern")

    return delta, signals


def high_value_return_signals(return_request=None, shopper_profile=None, config_weights=None):
    """CP5: High-value item return compared to customer's normal order value."""
    if not return_request or not shopper_profile:
        return 0, []

    avg_value = float(getattr(shopper_profile, "avg_order_value", 0) or 0)
    if avg_value <= 0:
        return 0, []

    # Calculate return value
    refund_amount = float(getattr(return_request, "refund_amount", 0) or 0)
    if refund_amount <= 0:
        # Try from order total
        order = getattr(return_request, "order", None)
        if order:
            refund_amount = float(getattr(order, "total", 0) or 0)

    if refund_amount <= 0 or avg_value <= 0:
        return 0, []

    ratio = refund_amount / avg_value

    if refund_amount >= 5000:
        return 25, [f"🚨 High-value return (₹{refund_amount:,.0f} >= ₹5,000 threshold) — Mandatory Physical Verification Required"]
    elif ratio >= 5:
        return 15, [f"Very high-value return (₹{refund_amount:,.0f} — {ratio:.1f}× normal) — Manual Review Required"]
    elif ratio >= 3:
        return 10, [f"High-value return (₹{refund_amount:,.0f} — {ratio:.1f}× normal)"]
    elif ratio >= 2:
        return 5, [f"Above-average return value (₹{refund_amount:,.0f} — {ratio:.1f}× normal)"]

    return 0, []


def immediate_return_signals(order=None, return_request=None, shopper_profile=None,
                              config_weights=None):
    """CP6: Return requested immediately after delivery."""
    if not order or not return_request:
        return 0, []

    delivered_at = getattr(order, "delivered_at", None)
    if not delivered_at:
        return 0, []

    try:
        return_at = return_request.created_at
        diff = return_at - delivered_at
        hours = diff.total_seconds() / 3600

        if hours < 1:
            # Very quick — but don't penalize heavily alone
            # Check if it's a repeated pattern
            returns = getattr(shopper_profile, "total_returns", 0) or 0
            if returns >= 3:
                return 10, [f"Repeated immediate return pattern (within {hours:.0f}h of delivery)"]
            return 5, [f"Very quick return request ({hours:.0f}h after delivery)"]
    except Exception:
        pass

    return 0, []


def deadline_return_signals(order=None, return_request=None, category=None,
                             shopper_profile=None, config_weights=None):
    """CP7: Return requested near the policy deadline repeatedly."""
    if not order or not return_request:
        return 0, []

    delivered_at = getattr(order, "delivered_at", None)
    if not delivered_at:
        return 0, []

    window_days = 7
    if category:
        window_days = getattr(category, "return_window_days", 7) or 7

    try:
        return_at = return_request.created_at
        diff = return_at - delivered_at
        days_used = diff.days

        if days_used >= window_days - 1:
            # Near deadline
            returns = getattr(shopper_profile, "total_returns", 0) or 0
            if returns >= 4:
                return 10, ["Strong repeated pattern of last-day returns"]
            elif returns >= 2:
                return 5, ["Repeated last-day return pattern"]
    except Exception:
        pass

    return 0, []


def same_product_return_signals(shopper_profile=None, config_weights=None):
    """CP8: Same product repeatedly returned."""
    if not shopper_profile:
        return 0, []

    count = getattr(shopper_profile, "same_product_return_count", 0) or 0

    if count >= 4:
        return 15, [f"Same product returned {count} times"]
    elif count >= 3:
        return 10, [f"Same product returned {count} times"]
    elif count >= 2:
        return 5, [f"Same product returned {count} times"]

    return 0, []


def damage_claim_signals(shopper_profile=None, config_weights=None):
    """CP9: Frequent damage claims."""
    if not shopper_profile:
        return 0, []

    claims = getattr(shopper_profile, "damage_claim_count", 0) or 0

    if claims >= 4:
        return 25, [f"Frequent damage claims ({claims} total) — proof required"]
    elif claims >= 3:
        return 15, [f"Repeated damage claims ({claims} total)"]
    elif claims >= 2:
        return 5, [f"Multiple damage claims ({claims} total)"]

    return 0, []


def damage_no_evidence_signals(shopper_profile=None, config_weights=None):
    """CP10: Damage claims without providing evidence/photos."""
    if not shopper_profile:
        return 0, []

    count = getattr(shopper_profile, "damage_no_evidence_count", 0) or 0

    if count >= 3:
        return 20, [f"Multiple damage claims without evidence ({count} times)"]
    elif count >= 2:
        return 10, [f"Repeated damage claims without evidence ({count} times)"]

    return 0, []


def reason_inconsistency_signals(return_request=None, shopper_profile=None,
                                  config_weights=None):
    """CP11: Return reason changed or inconsistent."""
    signals = []
    delta = 0

    # Check current return for reason change
    if return_request:
        if getattr(return_request, "reason_changed", False):
            history = getattr(return_request, "reason_change_history", []) or []
            changes = len(history)
            if changes >= 2:
                delta += 15
                signals.append(f"Major contradictions in return reason ({changes} changes)")
            elif changes >= 1:
                delta += 5
                signals.append("Return reason changed during process")
            else:
                delta += 5
                signals.append("Return reason inconsistency detected")

    # Check historical pattern
    if shopper_profile:
        lifetime_changes = getattr(shopper_profile, "reason_change_count", 0) or 0
        if lifetime_changes >= 3:
            delta += 5
            signals.append(f"History of reason changes ({lifetime_changes} across returns)")

    return delta, signals


def address_change_signals(shopper_profile=None, config_weights=None):
    """CP12: Frequent address changes (enhanced from basic mismatch)."""
    if not shopper_profile:
        return 0, []

    mismatches = getattr(shopper_profile, "address_mismatch_count", 0) or 0

    if mismatches >= 6:
        return 15, ["Highly frequent address changes (6+)"]
    elif mismatches >= 4:
        return 10, [f"Frequent address changes ({mismatches})"]
    elif mismatches >= 2:
        return 5, [f"Multiple address changes ({mismatches})"]
    elif mismatches >= 1:
        return _weight("address_mismatch", config_weights) * 0.4, ["Address mismatch detected"]

    return 0, []


def multi_account_signals(shopper_profile=None, user=None, config_weights=None):
    """CP13: Multiple accounts with same identity signals."""
    if not user:
        return 0, []

    signals = []
    delta = 0

    try:
        from accounts.models import ShopperProfile
        email = getattr(user, "email", "") or ""
        phone = getattr(user, "phone", "") or ""

        related_count = 0

        # Check for accounts sharing the same phone
        if phone:
            from accounts.models import User
            phone_matches = User.objects.filter(phone=phone).exclude(id=user.id).count()
            related_count += phone_matches

        # Check for similar email patterns (same domain + similar prefix)
        if email and "@" in email:
            domain = email.split("@")[1]
            from accounts.models import User
            domain_matches = User.objects.filter(
                email__endswith=f"@{domain}",
                role="shopper"
            ).exclude(id=user.id).count()
            # Only flag if suspicious number from same personal domain
            if domain not in ("gmail.com", "yahoo.com", "outlook.com", "hotmail.com") and domain_matches >= 2:
                related_count += domain_matches

        if related_count >= 3:
            delta += 30
            signals.append(f"Multiple related accounts detected ({related_count}+ shared signals)")
        elif related_count >= 2:
            delta += 20
            signals.append(f"Related accounts detected ({related_count} shared signals)")
        elif related_count >= 1:
            delta += 10
            signals.append("Potential multi-account activity")

    except Exception:
        pass

    return delta, signals


def refund_ratio_signals(shopper_profile=None, config_weights=None):
    """CP14: High refund-to-order ratio."""
    if not shopper_profile:
        return 0, []

    total_purchased = float(getattr(shopper_profile, "total_purchase_amount", 0) or 0)
    total_refunded = float(getattr(shopper_profile, "total_refund_amount", 0) or 0)

    if total_purchased <= 0:
        return 0, []

    ratio = total_refunded / total_purchased

    if ratio >= 0.6:
        return 25, [f"Very high refund ratio ({ratio:.0%} of ₹{total_purchased:,.0f} refunded)"]
    elif ratio >= 0.4:
        return 15, [f"High refund ratio ({ratio:.0%} of ₹{total_purchased:,.0f} refunded)"]
    elif ratio >= 0.2:
        return 5, [f"Elevated refund ratio ({ratio:.0%})"]

    return 0, []


def seasonal_behavior_signals(order_date=None, category_slug=None, shopper_profile=None,
                               config_weights=None):
    """CP15: Seasonal return behavior (enhanced).

    Detects post-festival/wedding season return spikes.
    """
    signals = []
    delta = 0

    # Check festive period
    if order_date:
        month = order_date.month if isinstance(order_date, datetime) else None
        if month and month in (9, 10, 11):  # Sep–Nov festive season in India
            delta += _weight("seasonal_signal", config_weights) * 0.5
            signals.append("Seasonal signal (festive period)")

    # Combine with category if also festive
    if category_slug and category_slug in SEASONAL_CATEGORIES:
        delta += _weight("seasonal_signal", config_weights) * 0.5
        signals.append("Festive/ethnic category during seasonal window")

    # Check for repeated seasonal pattern from history
    returns = getattr(shopper_profile, "total_returns", 0) or 0
    if returns >= 5 and category_slug in SEASONAL_CATEGORIES:
        delta += 10
        signals.append("Repeated seasonal return pattern detected")

    return delta, signals


def rejected_return_signals(shopper_profile=None, config_weights=None):
    """CP16: Previous rejected return claims."""
    if not shopper_profile:
        return 0, []

    rejected = getattr(shopper_profile, "rejected_return_count", 0) or 0

    if rejected >= 4:
        return 25, [f"Multiple previously rejected returns ({rejected}) — manual review required"]
    elif rejected >= 3:
        return 20, [f"Previous rejected returns ({rejected})"]
    elif rejected >= 2:
        return 10, [f"Previous rejected returns ({rejected})"]
    elif rejected >= 1:
        return 5, [f"One previously rejected return"]

    return 0, []


def unusual_quantity_signals(order=None, shopper_profile=None, config_weights=None):
    """CP17a: Unusual order quantity compared to customer's normal pattern."""
    if not order or not shopper_profile:
        return 0, []

    # Get total items in this order
    try:
        order_items = order.items.all()
        total_qty = sum(item.quantity for item in order_items)
    except Exception:
        return 0, []

    avg_qty = float(getattr(shopper_profile, "avg_items_per_order", 1) or 1)
    if avg_qty <= 0:
        avg_qty = 1

    ratio = total_qty / avg_qty

    returns = getattr(shopper_profile, "total_returns", 0) or 0

    if ratio >= 5 and returns >= 2:
        return 30, [f"Large unusual quantity ({total_qty} items, {ratio:.1f}× normal) + high returns"]
    elif ratio >= 5:
        return 20, [f"Very unusual order quantity ({total_qty} items, {ratio:.1f}× normal)"]
    elif ratio >= 3:
        return 10, [f"Unusual order quantity ({total_qty} items, {ratio:.1f}× normal)"]
    elif ratio >= 2:
        return 5, [f"Above-normal order quantity ({total_qty} items)"]

    return 0, []


def duplicate_return_request_signals(shopper_profile=None, order=None, config_weights=None):
    """CP23: Duplicate / multiple return requests for same order."""
    signals = []
    delta = 0

    if shopper_profile:
        dup_count = getattr(shopper_profile, "duplicate_return_request_count", 0) or 0
        if dup_count >= 3:
            delta += 20
            signals.append(f"Frequent duplicate return requests ({dup_count} times)")
        elif dup_count >= 2:
            delta += 10
            signals.append(f"Multiple duplicate return requests ({dup_count} times)")

    # Check current order for multiple return requests
    if order:
        try:
            from returns.models import ReturnRequest
            order_returns = ReturnRequest.objects.filter(order=order).count()
            if order_returns >= 3:
                delta += 15
                signals.append(f"This order has {order_returns} return requests")
            elif order_returns >= 2:
                delta += 5
                signals.append(f"This order has {order_returns} return requests")
        except Exception:
            pass

    return delta, signals


def open_box_verification_signals(order=None, reason=None, config_weights=None):
    """CP25: Post-acceptance wrong-product claims after open-box delivery."""
    if not order:
        return 0, []

    was_open_box = getattr(order, "open_box_delivery", False)
    was_accepted = getattr(order, "customer_accepted_open_box", False)

    if was_open_box and was_accepted:
        # Customer verified and accepted — later wrong-product claim is suspicious
        if reason and reason.lower() in ("wrong_product", "wrong product", "not_as_described"):
            return _weight("open_box_claim", config_weights), [
                "Wrong-product claim after open-box delivery acceptance — higher scrutiny"
            ]

    return 0, []


def customer_vs_product_rate_signals(shopper_profile=None, product=None,
                                      config_weights=None):
    """CP27: Compare customer return rate vs product return rate.

    If the product itself has a high return rate, don't penalize the customer heavily.
    """
    if not shopper_profile or not product:
        return 0, []

    # Customer return rate
    orders = shopper_profile.total_orders or 1
    returns = shopper_profile.total_returns or 0
    customer_rate = returns / orders

    # Product return rate
    product_sold = getattr(product, "total_sold_count", 0) or 0
    product_returns = getattr(product, "total_returns_count", 0) or 0
    product_rate = (product_returns / product_sold) if product_sold > 0 else 0

    # If product has high return rate, reduce customer penalty
    if product_rate >= 0.4:
        # Product itself is problematic
        if customer_rate > product_rate + 0.2:
            return 5, [
                f"Customer return rate ({customer_rate:.0%}) exceeds product rate ({product_rate:.0%}), "
                f"but product has known issues"
            ]
        return -5, [
            f"Product has high return rate ({product_rate:.0%}) — "
            f"customer return ({customer_rate:.0%}) not unusual"
        ]

    # Normal product, check if customer is outlier
    if customer_rate >= 0.75 and product_rate < 0.2:
        return 15, [
            f"Customer return rate ({customer_rate:.0%}) far exceeds "
            f"product rate ({product_rate:.0%})"
        ]
    elif customer_rate >= 0.5 and product_rate < 0.15:
        return 10, [
            f"Customer return rate ({customer_rate:.0%}) significantly above "
            f"product rate ({product_rate:.0%})"
        ]

    return 0, []


def customer_tenure_signals(shopper_profile=None, config_weights=None):
    """CP28: First-time customer vs long-term customer context."""
    if not shopper_profile:
        return 0, []

    joined_at = getattr(shopper_profile, "joined_at", None)
    orders = shopper_profile.total_orders or 0
    returns = shopper_profile.total_returns or 0
    deliveries = getattr(shopper_profile, "successful_deliveries", 0) or 0

    signals = []
    delta = 0

    # Calculate account age
    account_days = 0
    if joined_at:
        try:
            from django.utils import timezone
            now = timezone.now()
            diff = now - joined_at
            account_days = diff.days
        except Exception:
            pass

    # New account with aggressive behavior
    if account_days <= 30 and orders <= 5 and returns >= 3:
        delta += 15
        signals.append(
            f"New account ({account_days} days) with high return rate "
            f"({returns} returns in {orders} orders)"
        )
    elif account_days <= 60 and returns >= 4:
        delta += 10
        signals.append(f"Recent account ({account_days} days) with elevated returns")

    # Long-term loyal customer bonus
    if account_days >= 365 and orders >= 20 and deliveries >= 15:
        return_rate = returns / orders if orders else 0
        if return_rate < 0.2:
            delta -= 10
            signals.append(
                f"Loyal customer ({account_days // 365}+ years, {orders} orders, "
                f"{return_rate:.0%} return rate)"
            )

    return delta, signals


# ══════════════════════════════════════════════════════════
# LEGACY / EXISTING SIGNALS (kept for backward compat)
# ══════════════════════════════════════════════════════════

def payment_signals(payment_method, config_weights=None):
    """COD orders carry inherent risk."""
    if payment_method == "COD":
        return 5, ["COD order"]
    return 0, []


def category_signals(category_slug, config_weights=None):
    """Festive / seasonal categories carry higher return risk."""
    if category_slug in SEASONAL_CATEGORIES:
        return _weight("seasonal_signal", config_weights), ["Festive category"]
    return 0, []


def seasonal_signals(order_date=None, category_slug=None, config_weights=None):
    """Legacy wrapper — delegates to seasonal_behavior_signals."""
    return seasonal_behavior_signals(order_date, category_slug, config_weights=config_weights)


def reason_signals(reason, config_weights=None):
    """Weight the return based on its stated reason."""
    if not reason:
        return 0, []
    weight = REASON_WEIGHTS.get(reason, 6)
    return weight, [f"Return reason: {reason.replace('_', ' ')}"]


def address_mismatch_signals(shopper_profile, config_weights=None):
    """Legacy wrapper — delegates to address_change_signals."""
    return address_change_signals(shopper_profile, config_weights=config_weights)


def multiple_variant_signals(variant_count=1, shopper_profile=None, config_weights=None):
    """Flag orders with many variants (indicates over-ordering / bracketing)."""
    signals = []
    delta = 0

    if variant_count and variant_count >= 3:
        delta += _weight("multiple_variants", config_weights)
        signals.append("Multiple-variant order")
    elif variant_count and variant_count == 2:
        delta += _weight("multiple_variants", config_weights) * 0.4
        signals.append("Multi-variant order (minor)")

    # Also check lifetime pattern
    lifetime = getattr(shopper_profile, "multiple_variant_orders", 0) or 0
    if lifetime >= 5:
        delta += 5
        signals.append("Frequent multi-variant ordering history")

    return delta, signals


def high_value_cod_signals(order_total=0, payment_method="", shopper_profile=None, config_weights=None):
    """Flag high-value COD orders that increase merchant exposure."""
    if payment_method != "COD":
        return 0, []

    signals = []
    delta = 0

    if order_total and order_total >= HIGH_VALUE_COD_THRESHOLD:
        delta += _weight("high_value_cod", config_weights)
        signals.append("High-value COD order")

    # Check lifetime pattern
    lifetime = getattr(shopper_profile, "high_value_cod_count", 0) or 0
    if lifetime >= 3:
        delta += 5
        signals.append("Frequent high-value COD history")

    return delta, signals


def escalation_signals(escalation_level=0, config_weights=None):
    """Customers with existing escalation carry inherent extra risk."""
    if escalation_level >= 3:
        return _weight("escalation_bonus", config_weights) * 2, ["Previous restrictions violated"]
    elif escalation_level >= 1:
        return _weight("escalation_bonus", config_weights), ["Existing escalation level"]
    return 0, []


# ══════════════════════════════════════════════════════════
# WHITELIST & BLACKLIST OVERRIDES (Feature 2)
# ══════════════════════════════════════════════════════════

def check_merchant_rules(*, merchant=None, email="", phone="", device_token="", pincode=""):
    """Check explicit VIP Whitelist and Permanent Blacklist rules.

    Returns:
        is_whitelisted: bool
        is_blacklisted: bool
        rule_reason: str
    """
    if not merchant:
        return False, False, ""

    try:
        from fraud.models import MerchantListRule
        rules = MerchantListRule.objects.filter(merchant=merchant, is_active=True)

        for rule in rules:
            rtype = rule.rule_type
            etype = rule.entry_type
            val = rule.value.strip().lower()

            matched = False
            if etype == "email" and email and email.lower() == val:
                matched = True
            elif etype == "phone" and phone and val in phone:
                matched = True
            elif etype == "device_token" and device_token and val == device_token:
                matched = True
            elif etype == "pincode" and pincode and val == pincode:
                matched = True

            if matched:
                if rtype == "whitelist":
                    return True, False, rule.reason or "VIP Whitelisted"
                elif rtype == "blacklist":
                    return False, True, rule.reason or "Blacklisted entity"
    except Exception:
        pass

    return False, False, ""
