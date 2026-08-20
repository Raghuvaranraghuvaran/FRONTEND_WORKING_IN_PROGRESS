"""Extract structured fraud signals from domain objects.

Keep these small and focused so the risk engine avoids repeated history scans.
"""

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


def shopper_signals(shopper_profile):
    """Return (base_score_delta, signals) from a shopper's history."""
    signals = []
    delta = 0

    orders = shopper_profile.total_orders or 0
    returns = shopper_profile.total_returns or 0
    return_rate = (returns / orders) if orders else 0

    if return_rate > 0.4:
        delta += 32
        signals.append("High return frequency")
    elif return_rate > 0.2:
        delta += 16
        signals.append("Elevated return frequency")
    else:
        delta -= 5
        signals.append("Low return frequency")

    if shopper_profile.total_cod_refusals > 0:
        delta += 18
        signals.append("COD refusal history")

    if shopper_profile.device_reuse_flag:
        delta += 22
        signals.append("Device reuse")

    if shopper_profile.risk_tier == "Low":
        delta -= 8
        signals.append("Known low-risk customer")

    return delta, signals


def payment_signals(payment_method):
    if payment_method == "COD":
        return 5, ["COD order"]
    return 0, []


def category_signals(category_slug):
    if category_slug == "cat_ethnic":
        return 14, ["Festive category"]
    return 0, []


def reason_signals(reason):
    if not reason:
        return 0, []
    weight = REASON_WEIGHTS.get(reason, 6)
    return weight, ["Return reason"]
