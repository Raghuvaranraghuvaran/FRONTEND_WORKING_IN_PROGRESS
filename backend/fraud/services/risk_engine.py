"""Composite fraud scoring engine — 4-Tier Architecture (Return Guard Risk Checkpoints).

Scoring pipeline:
    Type A — ELIGIBILITY CHECK (gate: reject ineligible returns before scoring)
    Type B — PRODUCT VERIFICATION (serial/IMEI, condition, packaging, accessories)
    Type C — CUSTOMER BEHAVIOR RISK (28 checkpoint signals)
    Type D — DECISION ENGINE (combine all + relative benchmarks → score → tier → action)

Scoring flow:
    RETURN EVENT
    → TYPE A: ELIGIBILITY CHECK (pass/fail gate)
    → TYPE B: PRODUCT VERIFICATION SIGNALS
    → TYPE C: CUSTOMER BEHAVIOR SIGNALS
    → AGGREGATE INTO FINAL SCORE 0–100
    → LOW / MEDIUM / HIGH / CRITICAL
    → RECOMMENDED ACTION
"""

from dataclasses import dataclass, field
from typing import Optional, List

from . import signal_extractors


@dataclass
class CheckpointResult:
    """Result of a single checkpoint evaluation."""
    checkpoint_id: str
    checkpoint_name: str
    tier_type: str  # A, B, C
    score_delta: int
    signals: list = field(default_factory=list)
    severity: str = "pass"  # pass, low, medium, high, critical


@dataclass
class RiskResult:
    score: int
    tier: str
    signals: list = field(default_factory=list)
    recommended_action: str = "accept"
    checkpoints: list = field(default_factory=list)  # List of CheckpointResult
    eligibility_passed: bool = True
    eligibility_reasons: list = field(default_factory=list)


class RiskEngine:
    """Composite fraud scoring engine — 4-Tier Architecture.

    The engine runs all 28 checkpoints from the Return Guard Risk Checkpoints PDF
    in sequence: Eligibility → Product Verification → Customer Behavior → Decision.
    """

    # Default thresholds (overridable via FraudConfiguration)
    LOW_MAX = 34
    MEDIUM_MAX = 64
    CRITICAL_MIN = 85  # New tier for serial/IMEI mismatch and product swap

    def __init__(self, fraud_config=None):
        """Optionally load merchant-specific weights and thresholds."""
        self.config_weights = None
        if fraud_config:
            self.config_weights = fraud_config.weights or {}
            thresholds = fraud_config.thresholds or {}
            self.LOW_MAX = thresholds.get("low_max", self.LOW_MAX)
            self.MEDIUM_MAX = thresholds.get("medium_max", self.MEDIUM_MAX)
            self.CRITICAL_MIN = thresholds.get("critical_min", self.CRITICAL_MIN)

    def score(
        self,
        *,
        # Core context
        merchant=None,
        email: str = "",
        phone: str = "",
        device_token: str = "",
        pincode: str = "",
        shopper_profile=None,
        payment_method: str = "",
        category_slug: Optional[str] = None,
        reason: Optional[str] = None,
        order_total: float = 0,
        variant_count: int = 1,
        escalation_level: int = 0,
        order_date=None,
        # Extended context for 28 checkpoints
        order=None,
        order_item=None,
        return_request=None,
        category=None,
        product=None,
        user=None,
        return_type: str = "REFUND",
        replacement_count: int = 0,
    ) -> RiskResult:
        # ── Whitelist / Blacklist overrides ──────────────
        if shopper_profile:
            u = getattr(shopper_profile, "user", None)
            if u:
                email = email or getattr(u, "email", "")
                phone = phone or getattr(u, "phone", "")

        is_wl, is_bl, rule_reason = signal_extractors.check_merchant_rules(
            merchant=merchant, email=email, phone=phone,
            device_token=device_token, pincode=pincode
        )
        if is_wl:
            return RiskResult(
                score=0, tier="Low",
                signals=["VIP Whitelist bypass: " + rule_reason],
                recommended_action="accept",
                eligibility_passed=True,
            )
        if is_bl:
            return RiskResult(
                score=100, tier="High",
                signals=["Permanent Blacklist: " + rule_reason],
                recommended_action="reject",
                eligibility_passed=True,
            )

        checkpoints = []
        all_signals = []
        total_score = 10  # base score

        # ════════════════════════════════════════════════
        # TYPE A — ELIGIBILITY CHECKS
        # ════════════════════════════════════════════════
        eligible, elig_reasons = signal_extractors.check_return_eligibility(
            order=order,
            order_item=order_item,
            category=category,
            return_type=return_type,
            replacement_count=replacement_count,
        )

        cp = CheckpointResult(
            checkpoint_id="CP26",
            checkpoint_name="Return Eligibility",
            tier_type="A",
            score_delta=0 if eligible else 100,
            signals=elig_reasons if elig_reasons else ["Return eligible per policy"],
            severity="pass" if eligible else "critical",
        )
        checkpoints.append(cp)

        if not eligible:
            return RiskResult(
                score=100, tier="High",
                signals=elig_reasons,
                recommended_action="reject",
                checkpoints=checkpoints,
                eligibility_passed=False,
                eligibility_reasons=elig_reasons,
            )

        # ════════════════════════════════════════════════
        # TYPE B — PRODUCT VERIFICATION SIGNALS
        # ════════════════════════════════════════════════
        type_b_checks = [
            ("CP17b", "Serial/IMEI Mismatch",
             signal_extractors.serial_imei_mismatch_signals,
             {"return_request": return_request, "order_item": order_item}),
            ("CP21", "Product Swap Detection",
             signal_extractors.product_swap_signals,
             {"return_request": return_request}),
            ("CP19", "Product Condition",
             signal_extractors.product_condition_signals,
             {"return_request": return_request}),
            ("CP20", "Packaging Condition",
             signal_extractors.packaging_mismatch_signals,
             {"return_request": return_request}),
            ("CP18", "Missing Accessories",
             signal_extractors.missing_accessories_signals,
             {"return_request": return_request}),
            ("CP22", "Quantity Mismatch",
             signal_extractors.quantity_mismatch_signals,
             {"return_request": return_request}),
        ]

        for cp_id, cp_name, extractor, kwargs in type_b_checks:
            kwargs["config_weights"] = self.config_weights
            delta, sigs = extractor(**kwargs)
            total_score += delta
            all_signals.extend(sigs)

            severity = "pass"
            if delta >= 40:
                severity = "critical"
            elif delta >= 15:
                severity = "high"
            elif delta >= 5:
                severity = "medium"
            elif delta > 0:
                severity = "low"

            checkpoints.append(CheckpointResult(
                checkpoint_id=cp_id,
                checkpoint_name=cp_name,
                tier_type="B",
                score_delta=delta,
                signals=sigs,
                severity=severity,
            ))

        # ════════════════════════════════════════════════
        # TYPE C — CUSTOMER BEHAVIOR SIGNALS
        # ════════════════════════════════════════════════
        cw = self.config_weights

        type_c_checks = [
            # Existing behavioral signals
            ("CP_HIST", "Return History",
             signal_extractors.shopper_signals,
             {"shopper_profile": shopper_profile} if shopper_profile else None),

            # New CP1-3: Size exchange signals
            ("CP1-3", "Size Exchange Patterns",
             signal_extractors.size_exchange_signals,
             {"shopper_profile": shopper_profile, "variant_count": variant_count}),

            # CP4: Wardrobing
            ("CP4", "Wardrobing Pattern",
             signal_extractors.wardrobing_signals,
             {"shopper_profile": shopper_profile, "reason": reason,
              "category_slug": category_slug, "order_date": order_date,
              "return_request": return_request}),

            # CP5: High-value return
            ("CP5", "High-Value Return",
             signal_extractors.high_value_return_signals,
             {"return_request": return_request, "shopper_profile": shopper_profile}),

            # CP6: Immediate return after delivery
            ("CP6", "Immediate Return",
             signal_extractors.immediate_return_signals,
             {"order": order, "return_request": return_request,
              "shopper_profile": shopper_profile}),

            # CP7: Return near policy deadline
            ("CP7", "Near-Deadline Return",
             signal_extractors.deadline_return_signals,
             {"order": order, "return_request": return_request,
              "category": category, "shopper_profile": shopper_profile}),

            # CP8: Same product repeatedly returned
            ("CP8", "Same Product Returns",
             signal_extractors.same_product_return_signals,
             {"shopper_profile": shopper_profile}),

            # CP9: Frequent damage claims
            ("CP9", "Damage Claim History",
             signal_extractors.damage_claim_signals,
             {"shopper_profile": shopper_profile}),

            # CP10: Damage without evidence
            ("CP10", "Damage Without Evidence",
             signal_extractors.damage_no_evidence_signals,
             {"shopper_profile": shopper_profile}),

            # CP11: Reason inconsistency
            ("CP11", "Reason Inconsistency",
             signal_extractors.reason_inconsistency_signals,
             {"return_request": return_request, "shopper_profile": shopper_profile}),

            # CP12: Address changes
            ("CP12", "Address Changes",
             signal_extractors.address_change_signals,
             {"shopper_profile": shopper_profile}),

            # CP13: Multi-account
            ("CP13", "Multi-Account Detection",
             signal_extractors.multi_account_signals,
             {"shopper_profile": shopper_profile, "user": user}),

            # CP14: Refund ratio
            ("CP14", "Refund-to-Order Ratio",
             signal_extractors.refund_ratio_signals,
             {"shopper_profile": shopper_profile}),

            # CP15: Seasonal behavior
            ("CP15", "Seasonal Behavior",
             signal_extractors.seasonal_behavior_signals,
             {"order_date": order_date, "category_slug": category_slug,
              "shopper_profile": shopper_profile}),

            # CP16: Rejected returns
            ("CP16", "Previous Rejected Returns",
             signal_extractors.rejected_return_signals,
             {"shopper_profile": shopper_profile}),

            # CP17a: Unusual quantity
            ("CP17a", "Unusual Order Quantity",
             signal_extractors.unusual_quantity_signals,
             {"order": order, "shopper_profile": shopper_profile}),

            # CP23: Duplicate return requests
            ("CP23", "Duplicate Return Requests",
             signal_extractors.duplicate_return_request_signals,
             {"shopper_profile": shopper_profile, "order": order}),

            # CP25: Open-box verification
            ("CP25", "Open-Box Verification",
             signal_extractors.open_box_verification_signals,
             {"order": order, "reason": reason}),

            # CP27: Customer vs product return rate
            ("CP27", "Customer vs Product Rate",
             signal_extractors.customer_vs_product_rate_signals,
             {"shopper_profile": shopper_profile, "product": product}),

            # CP28: Customer tenure
            ("CP28", "Customer Tenure",
             signal_extractors.customer_tenure_signals,
             {"shopper_profile": shopper_profile}),

            # Legacy signals
            ("CP_PAY", "Payment Method",
             signal_extractors.payment_signals,
             {"payment_method": payment_method} if payment_method else None),

            ("CP_REASON", "Return Reason",
             signal_extractors.reason_signals,
             {"reason": reason} if reason else None),

            ("CP_VARIANT", "Multiple Variants",
             signal_extractors.multiple_variant_signals,
             {"variant_count": variant_count, "shopper_profile": shopper_profile}),

            ("CP_HV_COD", "High-Value COD",
             signal_extractors.high_value_cod_signals,
             {"order_total": order_total, "payment_method": payment_method,
              "shopper_profile": shopper_profile} if payment_method and order_total else None),

            ("CP_ESC", "Escalation Level",
             signal_extractors.escalation_signals,
             {"escalation_level": escalation_level}),
        ]

        for cp_id, cp_name, extractor, kwargs in type_c_checks:
            if kwargs is None:
                continue

            kwargs["config_weights"] = cw
            try:
                delta, sigs = extractor(**kwargs)
            except TypeError:
                # Some extractors don't accept config_weights
                kwargs.pop("config_weights", None)
                try:
                    delta, sigs = extractor(**kwargs)
                except Exception:
                    delta, sigs = 0, []

            total_score += delta
            all_signals.extend(sigs)

            severity = "pass"
            if delta >= 25:
                severity = "high"
            elif delta >= 10:
                severity = "medium"
            elif delta > 0:
                severity = "low"
            elif delta < 0:
                severity = "pass"  # bonus / reduction

            checkpoints.append(CheckpointResult(
                checkpoint_id=cp_id,
                checkpoint_name=cp_name,
                tier_type="C",
                score_delta=delta,
                signals=sigs,
                severity=severity,
            ))

        # ════════════════════════════════════════════════
        # TYPE D — DECISION ENGINE (final score + tier)
        # ════════════════════════════════════════════════
        total_score = max(0, min(100, round(total_score)))
        tier = self.tier_for_score(total_score)
        action = self.recommended_action(tier)

        return RiskResult(
            score=total_score,
            tier=tier,
            signals=all_signals,
            recommended_action=action,
            checkpoints=checkpoints,
            eligibility_passed=True,
        )

    def tier_for_score(self, score: int) -> str:
        if score >= self.CRITICAL_MIN:
            return "Critical"
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
        if tier == "Critical":
            return "hold"
        return "review"
