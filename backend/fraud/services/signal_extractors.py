"""Extract structured fraud signals from domain objects.

Implements all signal types defined in the RG Architecture:
- COD behavior (refusals, COD orders)
- Return behavior (frequency, patterns)
- Order behavior (multiple variants, unusual ordering)
- High-value COD signals
- Seasonal / wardrobing patterns
- Address mismatch signals
- Escalation level bonus (repeat offenders)

Each extractor returns (score_delta, signals_list).
"""

from datetime import datetime

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


# ──────────────────────────────────────────────────────────
# 1. Shopper history signals (COD + return behavior)
# ──────────────────────────────────────────────────────────

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


# ──────────────────────────────────────────────────────────
# 2. Payment method signals
# ──────────────────────────────────────────────────────────

def payment_signals(payment_method, config_weights=None):
    """COD orders carry inherent risk."""
    if payment_method == "COD":
        return 5, ["COD order"]
    return 0, []


# ──────────────────────────────────────────────────────────
# 3. Category / seasonal signals
# ──────────────────────────────────────────────────────────

def category_signals(category_slug, config_weights=None):
    """Festive / seasonal categories carry higher return risk."""
    if category_slug in SEASONAL_CATEGORIES:
        return _weight("seasonal_signal", config_weights), ["Festive category"]
    return 0, []


def seasonal_signals(order_date=None, category_slug=None, config_weights=None):
    """Detect seasonal / wardrobing patterns based on timing and category."""
    signals = []
    delta = 0

    # Check if the order falls in a known festive window
    if order_date:
        month = order_date.month if isinstance(order_date, datetime) else None
        if month and month in (9, 10, 11):  # Sep–Nov festive season in India
            delta += _weight("seasonal_signal", config_weights) * 0.5
            signals.append("Seasonal signal (festive period)")

    # Combine with category if also festive
    if category_slug and category_slug in SEASONAL_CATEGORIES:
        delta += _weight("seasonal_signal", config_weights) * 0.5
        signals.append("Potential wardrobing pattern")

    return delta, signals


# ──────────────────────────────────────────────────────────
# 4. Return reason signals
# ──────────────────────────────────────────────────────────

def reason_signals(reason, config_weights=None):
    """Weight the return based on its stated reason."""
    if not reason:
        return 0, []
    weight = REASON_WEIGHTS.get(reason, 6)
    return weight, [f"Return reason: {reason.replace('_', ' ')}"]


# ──────────────────────────────────────────────────────────
# 5. Address mismatch signals
# ──────────────────────────────────────────────────────────

def address_mismatch_signals(shopper_profile, config_weights=None):
    """Flag customers with repeated address inconsistencies."""
    mismatches = getattr(shopper_profile, "address_mismatch_count", 0) or 0
    if mismatches >= 3:
        return _weight("address_mismatch", config_weights), ["Repeated address inconsistencies"]
    elif mismatches >= 1:
        return _weight("address_mismatch", config_weights) * 0.4, ["Address mismatch detected"]
    return 0, []


# ──────────────────────────────────────────────────────────
# 6. Multiple-variant / high-value COD signals
# ──────────────────────────────────────────────────────────

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


# ──────────────────────────────────────────────────────────
# 7. Escalation level bonus signals
# ──────────────────────────────────────────────────────────

def escalation_signals(escalation_level=0, config_weights=None):
    """Customers with existing escalation carry inherent extra risk."""
    if escalation_level >= 3:
        return _weight("escalation_bonus", config_weights) * 2, ["Previous restrictions violated"]
    elif escalation_level >= 1:
        return _weight("escalation_bonus", config_weights), ["Existing escalation level"]
    return 0, []
