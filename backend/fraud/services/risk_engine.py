from dataclasses import dataclass, field
from typing import Optional

from . import signal_extractors


@dataclass
class RiskResult:
    score: int
    tier: str
    signals: list = field(default_factory=list)


class RiskEngine:
    """Composite fraud scoring engine.

    The engine aggregates signals from shopper history, payment method,
    product category and return reason into a single 0-100 score, then maps
    that score to a decision tier.
    """

    LOW_MAX = 34
    MEDIUM_MAX = 64

    def score(
        self,
        *,
        shopper_profile=None,
        payment_method: str = "",
        category_slug: Optional[str] = None,
        reason: Optional[str] = None,
    ) -> RiskResult:
        score = 10
        signals = []

        if shopper_profile is not None:
            delta, shopper_signals = signal_extractors.shopper_signals(shopper_profile)
            score += delta
            signals.extend(shopper_signals)

        if payment_method:
            delta, payment_signals = signal_extractors.payment_signals(payment_method)
            score += delta
            signals.extend(payment_signals)

        if category_slug:
            delta, category_signals = signal_extractors.category_signals(category_slug)
            score += delta
            signals.extend(category_signals)

        if reason:
            delta, reason_signals = signal_extractors.reason_signals(reason)
            score += delta
            signals.extend(reason_signals)

        score = max(0, min(100, round(score)))
        tier = self.tier_for_score(score)
        return RiskResult(score=score, tier=tier, signals=signals)

    def tier_for_score(self, score: int) -> str:
        if score > self.MEDIUM_MAX:
            return "High"
        if score > self.LOW_MAX:
            return "Medium"
        return "Low"
