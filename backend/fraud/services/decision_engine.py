"""Map risk tiers to workflow decisions (RG Architecture Section 5).

The decision engine recommends merchant actions but the merchant has
final control over whether an order is processed or restricted.

Flow per PDF:
    NEW ORDER → RISK ANALYSIS → MERCHANT DECISION
    LOW RISK   → ACCEPT / NORMAL FLOW
    MEDIUM RISK → VERIFY → ACCEPT / REJECT / RESTRICT
    HIGH RISK   → REVIEW → ACCEPT / REJECT / RESTRICT

Available merchant actions (Section 5):
    - Accept Order
    - Reject Order
    - Request Verification (OTP/address/payment)
    - Restrict COD
    - Restrict High-Value Orders
    - Require Prepaid
    - Send for Manual Review
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
    "increase_restriction": "Escalate the restriction level",
    "remove_restriction": "Restore normal access",
    "suspend_account": "Temporarily suspend the customer account",
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
            }

        if risk_tier == "Medium":
            actions = ["accept", "reject", "verify", "restrict_cod", "restrict_high_value"]
            return {
                "status": "pending_verification",
                "outcome": "pending_review",
                "requires_otp": True,
                "recommended_action": "verify",
                "available_actions": actions,
                "escalation_recommendation": "verify" if escalation_level < 2 else "restrict_cod",
            }

        # High risk
        actions = [
            "accept", "reject", "verify", "restrict_cod",
            "restrict_high_value", "require_prepaid",
            "manual_review", "increase_restriction", "suspend_account",
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
        }

    def re_score_after_otp(self, risk_tier: str, score: int):
        """A successful OTP step reduces the effective risk."""
        new_score = max(5, score - 15)
        if risk_tier == "High":
            return new_score, "High"
        return new_score, "Low" if new_score <= 34 else "Medium"

    def get_action_description(self, action: str) -> str:
        """Return a human-readable description for a merchant action."""
        return MERCHANT_ACTIONS.get(action, action)
