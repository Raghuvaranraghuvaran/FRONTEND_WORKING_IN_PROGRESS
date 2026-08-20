"""Map risk tiers to workflow decisions.

- LOW  -> auto-approve
- MEDIUM -> require OTP verification, then re-score
- HIGH -> manual review
"""


class DecisionEngine:
    def decide(self, risk_tier: str):
        if risk_tier == "Low":
            return {"status": "approved", "outcome": "auto_approved", "requires_otp": False}
        if risk_tier == "Medium":
            return {"status": "manual_review", "outcome": "pending_review", "requires_otp": True}
        return {"status": "manual_review", "outcome": "pending_review", "requires_otp": False}

    def re_score_after_otp(self, risk_tier: str, score: int):
        """A successful OTP step reduces the effective risk."""
        new_score = max(5, score - 15)
        if risk_tier == "High":
            return new_score, "High"
        return new_score, "Low" if new_score <= 34 else "Medium"
