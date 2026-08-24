"""Composite fraud scoring engine (RG Architecture Section 4).

The engine aggregates all signal types from shopper history, payment method,
product category, return reason, address, variant count, order value, and
escalation level into a single 0–100 score, then maps that score to a
decision tier (LOW / MEDIUM / HIGH) with recommended actions.

Scoring flow from the PDF:
    ORDER / RETURN EVENT
    → FETCH CUSTOMER HISTORY
    → CALCULATE BEHAVIOR METRICS
    → APPLY WEIGHTED RULES
    → FINAL SCORE 0–100
    → LOW / MEDIUM / HIGH
    → RECOMMENDED ACTION
"""

from dataclasses import dataclass, field
from typing import Optional

from . import signal_extractors


@dataclass
class RiskResult:
    score: int
    tier: str
    signals: list = field(default_factory=list)
    recommended_action: str = "accept"


class RiskEngine:
    """Composite fraud scoring engine.

    The engine aggregates signals from shopper history, payment method,
    product category, return reason, address, variants, order value, and
    escalation level into a single 0-100 score, then maps that score to
    a decision tier with a recommended merchant action.
    """

    # Default thresholds (overridable via FraudConfiguration)
    LOW_MAX = 34
    MEDIUM_MAX = 64

    def __init__(self, fraud_config=None):
        """Optionally load merchant-specific weights and thresholds."""
        self.config_weights = None
        if fraud_config:
            self.config_weights = fraud_config.weights or {}
            thresholds = fraud_config.thresholds or {}
            self.LOW_MAX = thresholds.get("low_max", self.LOW_MAX)
            self.MEDIUM_MAX = thresholds.get("medium_max", self.MEDIUM_MAX)

    def score(
        self,
        *,
        shopper_profile=None,
        payment_method: str = "",
        category_slug: Optional[str] = None,
        reason: Optional[str] = None,
        order_total: float = 0,
        variant_count: int = 1,
        escalation_level: int = 0,
        order_date=None,
    ) -> RiskResult:
        score = 10  # base score
        signals = []
        cw = self.config_weights

        # 1. Shopper history (return behavior + COD behavior)
        if shopper_profile is not None:
            delta, s = signal_extractors.shopper_signals(shopper_profile, cw)
            score += delta
            signals.extend(s)

        # 2. Payment method
        if payment_method:
            delta, s = signal_extractors.payment_signals(payment_method, cw)
            score += delta
            signals.extend(s)

        # 3. Category risk
        if category_slug:
            delta, s = signal_extractors.category_signals(category_slug, cw)
            score += delta
            signals.extend(s)

        # 4. Seasonal / wardrobing
        if order_date or category_slug:
            delta, s = signal_extractors.seasonal_signals(order_date, category_slug, cw)
            score += delta
            signals.extend(s)

        # 5. Return reason
        if reason:
            delta, s = signal_extractors.reason_signals(reason, cw)
            score += delta
            signals.extend(s)

        # 6. Address mismatch
        if shopper_profile is not None:
            delta, s = signal_extractors.address_mismatch_signals(shopper_profile, cw)
            score += delta
            signals.extend(s)

        # 7. Multiple variants
        delta, s = signal_extractors.multiple_variant_signals(variant_count, shopper_profile, cw)
        score += delta
        signals.extend(s)

        # 8. High-value COD
        if payment_method and order_total:
            delta, s = signal_extractors.high_value_cod_signals(
                order_total, payment_method, shopper_profile, cw
            )
            score += delta
            signals.extend(s)

        # 9. Escalation level bonus
        delta, s = signal_extractors.escalation_signals(escalation_level, cw)
        score += delta
        signals.extend(s)

        # Clamp and classify
        score = max(0, min(100, round(score)))
        tier = self.tier_for_score(score)
        action = self.recommended_action(tier)

        return RiskResult(
            score=score,
            tier=tier,
            signals=signals,
            recommended_action=action,
        )

    def tier_for_score(self, score: int) -> str:
        if score > self.MEDIUM_MAX:
            return "High"
        if score > self.LOW_MAX:
            return "Medium"
        return "Low"

    def recommended_action(self, tier: str) -> str:
        """Map risk tier to a recommended action per PDF Section 5."""
        if tier == "Low":
            return "accept"
        if tier == "Medium":
            return "verify"
        return "review"
