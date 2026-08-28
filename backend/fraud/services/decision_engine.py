"""Map risk tiers to workflow decisions (RG Architecture Section 5).

The decision engine recommends merchant actions but the merchant has
final control over whether an order is processed or restricted.

Flow per PDF:
    NEW ORDER → RISK ANALYSIS → MERCHANT DECISION
    LOW RISK     → ACCEPT / NORMAL FLOW
    MEDIUM RISK  → VERIFY → ACCEPT / REJECT / RESTRICT
    HIGH RISK    → REVIEW → ACCEPT / REJECT / RESTRICT
    CRITICAL     → HOLD + MANUAL VERIFICATION (serial/IMEI mismatch, product swap)

Available merchant actions (Section 5):
    - Accept Order
    - Reject Order
    - Request Verification (OTP/address/payment)
    - Restrict COD
    - Restrict High-Value Orders
    - Require Prepaid
    - Send for Manual Review
    - Hold Return (pending physical verification)
    - Approve/Remove Restriction
    - View Risk Reasons
"""


MERCHANT_ACTIONS = {
    "accept": "Allow the order to proceed",
    "reject": "Cancel the suspicious order",
    "verify": "Ask for OTP/address/payment verification",
    "restrict_cod": "Prevent COD for the customer",
    "restrict_high_value": "Allow only orders below a chosen value",
    "require_prepaid": "Customer must pay before processing",
    "manual_review": "Merchant personally reviews the case",
    "hold": "Hold return — pending product verification",
    "partial_refund": "Issue partial refund (deduct missing accessories / damage)",
    "increase_restriction": "Escalate the restriction level",
    "remove_restriction": "Restore normal access",
    "suspend_account": "Temporarily suspend the customer account",
    "request_proof": "Request photo/video evidence from customer",
}


class DecisionEngine:

    def decide(self, risk_tier: str, escalation_level: int = 0):
        """Return a decision recommendation with available merchant actions.

        The merchant always has the final say — these are recommendations only.
        """
        if risk_tier == "Low":
            return {
                "status": "approved",
                "outcome": "auto_approved",
                "requires_otp": False,
                "recommended_action": "accept",
                "available_actions": ["accept"],
                "escalation_recommendation": None,
                "risk_level_label": "Low Risk",
                "risk_level_color": "#22c55e",
            }

        if risk_tier == "Medium":
            actions = ["accept", "reject", "verify", "restrict_cod",
                       "restrict_high_value", "request_proof"]
            return {
                "status": "pending_verification",
                "outcome": "pending_review",
                "requires_otp": True,
                "recommended_action": "verify",
                "available_actions": actions,
                "escalation_recommendation": "verify" if escalation_level < 2 else "restrict_cod",
                "risk_level_label": "Medium Risk",
                "risk_level_color": "#f59e0b",
            }

        if risk_tier == "Critical":
            actions = [
                "reject", "hold", "manual_review", "require_prepaid",
                "increase_restriction", "suspend_account",
                "partial_refund", "accept",
            ]
            return {
                "status": "hold",
                "outcome": "pending_review",
                "requires_otp": False,
                "recommended_action": "hold",
                "available_actions": actions,
                "escalation_recommendation": "suspend_account",
                "risk_level_label": "🚨 Critical Risk — Immediate Hold",
                "risk_level_color": "#dc2626",
            }

        # High risk
        actions = [
            "accept", "reject", "verify", "restrict_cod",
            "restrict_high_value", "require_prepaid",
            "manual_review", "hold", "request_proof",
            "increase_restriction", "suspend_account",
        ]
        recommended = "manual_review"
        if escalation_level >= 3:
            recommended = "require_prepaid"
        if escalation_level >= 4:
            recommended = "suspend_account"

        return {
            "status": "manual_review",
            "outcome": "pending_review",
            "requires_otp": False,
            "recommended_action": recommended,
            "available_actions": actions,
            "escalation_recommendation": "increase_restriction",
            "risk_level_label": "High Risk",
            "risk_level_color": "#ef4444",
        }

    def re_score_after_otp(self, risk_tier: str, score: int):
        """A successful OTP step reduces the effective risk."""
        new_score = max(5, score - 15)
        if risk_tier in ("High", "Critical"):
            return new_score, risk_tier
        return new_score, "Low" if new_score <= 34 else "Medium"

    def re_score_after_verification(self, return_request, checkpoints=None):
        """Re-score after product verification data is submitted.

        This is called when the warehouse agent submits Type B verification data.
        Returns updated score, tier, and recommended action.
        """
        # Type B signals contribute heavily to re-scoring
        type_b_score = 0
        type_b_signals = []

        if checkpoints:
            for cp in checkpoints:
                if cp.get("tier_type") == "B":
                    type_b_score += cp.get("score_delta", 0)
                    type_b_signals.extend(cp.get("signals", []))

        # If critical verification issues found
        if type_b_score >= 40:
            return {
                "new_score": min(100, type_b_score + 50),
                "new_tier": "Critical",
                "recommended_action": "hold",
                "type_b_signals": type_b_signals,
            }
        elif type_b_score >= 15:
            return {
                "new_score": min(100, type_b_score + 30),
                "new_tier": "High",
                "recommended_action": "manual_review",
                "type_b_signals": type_b_signals,
            }

        return {
            "new_score": type_b_score + 10,
            "new_tier": "Low",
            "recommended_action": "accept",
            "type_b_signals": type_b_signals,
        }

    def get_action_description(self, action: str) -> str:
        """Return a human-readable description for a merchant action."""
        return MERCHANT_ACTIONS.get(action, action)
