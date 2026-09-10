import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and display total page numbers."""
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages after cover)
        if self._pageNumber > 1:
            self.drawString(36, 762, "RETURNGUARD — COMPLETE SYSTEM SPECIFICATION & ARCHITECTURE BLUEPRINT")
            self.drawRightString(576, 762, "SHOPPER JOURNEY • ALL MERCHANT TABS • FLAGGED CASES")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(36, 755, 576, 755)

        # Footer (all pages)
        self.setFont("Helvetica", 7.5)
        self.drawString(36, 25, "CONFIDENTIAL & PROPRIETARY — RETURN GUARD TECHNOLOGIES (INDIA)")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(576, 25, page_str)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(36, 35, 576, 35)
        self.restoreState()

def build_pdf():
    pdf_filename = "full prject detils.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=46,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()

    # Brand color palette
    c_primary = colors.HexColor("#0f172a")    # Slate 900
    c_accent = colors.HexColor("#4338ca")     # Indigo 700
    c_accent_light = colors.HexColor("#e0e7ff")
    c_secondary = colors.HexColor("#1e293b")  # Slate 800
    c_body = colors.HexColor("#334155")       # Slate 700
    c_border = colors.HexColor("#cbd5e1")     # Slate 300
    c_bg_alt = colors.HexColor("#f8fafc")     # Slate 50
    c_critical = colors.HexColor("#b91c1c")   # Red 700
    c_warning = colors.HexColor("#b45309")    # Amber 700
    c_success = colors.HexColor("#15803d")    # Emerald 700

    # Typography styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=21,
        leading=25,
        textColor=c_primary,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=14,
        textColor=c_accent,
        spaceAfter=10
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=c_primary,
        spaceBefore=11,
        spaceAfter=5,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=c_accent,
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=c_secondary,
        spaceBefore=5,
        spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=c_body,
        spaceAfter=3
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=c_body,
        leftIndent=10,
        firstLineIndent=-7,
        spaceAfter=2
    )

    th_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.white
    )

    td_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=c_body
    )

    td_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=9,
        textColor=c_primary
    )

    story = []

    # =========================================================
    # DOCUMENT HEADER
    # =========================================================
    story.append(Paragraph("ReturnGuard — Complete System Specification", title_style))
    story.append(Paragraph("End-to-End Operational Blueprint: Shopper Flow, Complete Merchant Tabs, Flagged Case Review Engine, and 28-Checkpoint Risk Architecture", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_accent, spaceBefore=0, spaceAfter=8))

    meta_info = [
        [
            Paragraph("<b>Product Name:</b> ReturnGuard (RG)", td_style),
            Paragraph("<b>Target Market:</b> Indian D2C & High-Volume COD E-Commerce", td_style),
            Paragraph("<b>Architecture:</b> React 18 • Django 5.1 DRF • PostgreSQL RLS", td_style)
        ],
        [
            Paragraph("<b>Core Capability:</b> 4-Tier / 28 Checkpoints", td_style),
            Paragraph("<b>Auth:</b> SimpleJWT + Google OAuth 2.0", td_style),
            Paragraph("<b>Status:</b> Production Verified Architecture (v2.4)", td_style)
        ]
    ]
    meta_table = Table(meta_info, colWidths=[180, 180, 180])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg_alt),
        ('BOX', (0,0), (-1,-1), 0.5, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    # =========================================================
    # 1. EXECUTIVE SUMMARY & PROBLEM LANDSCAPE
    # =========================================================
    story.append(Paragraph("1. Executive Summary & Market Problem Statement", h1_style))
    story.append(Paragraph(
        "Indian e-commerce is uniquely dominated by <b>Cash-on-Delivery (COD)</b>, comprising more than 60% of all Direct-to-Consumer (D2C) transactions. "
        "Because COD orders require zero financial authorization or identity commitment at checkout, merchants face alarming return rates of <b>30% to 45%</b> "
        "in fashion, apparel, and lifestyle categories (vs. a 15%–20% global baseline). "
        "Brands hemorrhage <b>15% to 20% of net margin</b> absorbing two-way courier freight, warehousing, packaging loss, and merchandise depreciation.", body_style
    ))
    story.append(Paragraph("<b>Specific Indian Fraud Vectors Addressed:</b>", h2_style))
    story.append(Paragraph("• <b>Wardrobing (Wear & Return):</b> Buying high-value ethnic or festive wear for weddings or Diwali, wearing it once for photographs, and returning it within the 7-day return window claiming 'changed mind' (CP4).", bullet_style))
    story.append(Paragraph("• <b>Size Bracketing & Serial Over-Ordering:</b> Buying sizes S, M, L, and XL in a single checkout with premeditated intent to keep only 1 garment and return 3 (CP1, CP2, CP3).", bullet_style))
    story.append(Paragraph("• <b>Merchandise & SKU Swapping:</b> Returning a counterfeit, older worn garment, or cheap duplicate instead of the authentic shipped product (CP21).", bullet_style))
    story.append(Paragraph("• <b>Serial / IMEI Mismatch:</b> Swapping high-end electronics with broken, stolen, or outdated units (CP17b).", bullet_style))
    story.append(Paragraph("• <b>Missing Accessories & Packaging Damage:</b> Omitting chargers, cables, or original manufacturer packaging while expecting full refunds (CP18, CP20).", bullet_style))
    story.append(Paragraph("• <b>Doorstep Courier Collusion:</b> Unverified return handoffs where couriers or customers manipulate unsealed parcels without digital proof of custody (CP25).", bullet_style))
    story.append(Paragraph("• <b>The Enterprise Affordability Gap:</b> Legacy fraud tools (Signifyd, Riskified) cost tens of thousands of dollars annually and focus purely on card chargebacks. ReturnGuard gives small-to-mid D2C brands ($50K–$5M ARR) an affordable, COD-native defense operating system.", bullet_style))

    story.append(Spacer(1, 8))

    # =========================================================
    # 2. END-TO-END SHOPPER PLATFORM & JOURNEY
    # =========================================================
    story.append(Paragraph("2. End-to-End Shopper Journey: All Screens & Capabilities", h1_style))
    story.append(Paragraph(
        "ReturnGuard adheres to a <i>'Frictionless by Default'</i> ethos. Honest buyers (85%+ of volume) experience zero friction, enjoying instant checkouts "
        "and automated 1-click return approvals. Step-up security is dynamically invoked only when behavioral or identity anomalies emerge.", body_style
    ))

    shopper_pages = [
        [Paragraph("<b>Shopper Screen / Page</b>", th_style), Paragraph("<b>User Features & Experience</b>", th_style), Paragraph("<b>Underlying Security & Fraud Logic</b>", th_style)],
        [
            Paragraph("<b>Landing & Home Feed</b><br/><i>LandingPage.jsx<br/>ShopperHomeFeed.jsx</i>", td_bold),
            Paragraph("Hero marketing banners, trending collections, category carousels, personalized recommendations, loyalty point balance, and trust guarantee badges.", td_style),
            Paragraph("Passive client device identification initialized in background (lightweight token stored in cookie/local storage). Zero user prompt.", td_style)
        ],
        [
            Paragraph("<b>Authentication & Login</b><br/><i>LoginPage.jsx<br/>RegisterPage.jsx</i>", td_bold),
            Paragraph("Standard Email/Password authentication, seamless 1-Click Google OAuth 2.0 social login, remember-me token management, password recovery.", td_style),
            Paragraph("Device token linked to authenticated user profile. Detects multi-account creation across shared physical devices (CP13).", td_style)
        ],
        [
            Paragraph("<b>Catalog & Product Detail</b><br/><i>ShopPage.jsx<br/>ProductDetailPage.jsx</i>", td_bold),
            Paragraph("Multi-filter faceted search (category, price, size, color), live inventory stock status, variant selectors, high-res image galleries, policy transparency badges.", td_style),
            Paragraph("Surfaces non-returnable categories (CP26: intimate apparel, cosmetics) and replacement limits (CP24) before the user adds items to cart.", td_style)
        ],
        [
            Paragraph("<b>Cart & Checkout</b><br/><i>CartPage.jsx<br/>CheckoutPage.jsx</i>", td_bold),
            Paragraph("Multi-item cart, promo coupon application, delivery address book with pin code validation, payment method selector (COD, UPI, Cards, NetBanking).", td_style),
            Paragraph("<b>Dynamic COD Restriction:</b> If buyer has high historical COD refusal (>50%) or active Step 2 restriction, COD is disabled with a friendly prompt to pay prepaid.", td_style)
        ],
        [
            Paragraph("<b>Payment Confirmation & Invoice</b><br/><i>PaymentSuccessPage.jsx<br/>PaymentFailurePage.jsx</i>", td_bold),
            Paragraph("Instant transaction outcome status, order summary, tracking number, and direct 1-click download of official PDF Tax Invoice.", td_style),
            Paragraph("Webhook-verified payment state; atomic transactions prevent stock overselling; failure recovery retry flow with payment status polling.", td_style)
        ],
        [
            Paragraph("<b>Order History & Tracking</b><br/><i>OrdersPage.jsx<br/>ReturnTrackingPage.jsx</i>", td_bold),
            Paragraph("Chronological past orders, visual milestone shipment tracker (Ordered → Packed → Shipped → Out for Delivery → Delivered), invoice redownload.", td_style),
            Paragraph("Eligibility check per item: Displays active return window countdown (e.g., '4 days left to return'). Disables returns on expired items.", td_style)
        ],
        [
            Paragraph("<b>Self-Service Return Request</b><br/><i>ReturnRequestPage.jsx</i>", td_bold),
            Paragraph("Select order items, choose return reason (Defective, Size Issue, Wrong Item, Changed Mind), photo upload for damage, doorstep pickup scheduling.", td_style),
            Paragraph("Pre-scoring gates run instantly (CP24, CP26). Evaluates seasonal wardrobing (CP4) and size bracketing (CP2). Assigns real-time risk score.", td_style)
        ],
        [
            Paragraph("<b>Step-Up Verification Challenge</b><br/><i>Verification Modal / Page</i>", td_bold),
            Paragraph("Low-risk returns are auto-approved instantly. Medium-risk cases prompt a clean 6-digit SMS OTP challenge sent to the customer's phone.", td_style),
            Paragraph("Successful OTP lowers composite risk score by -15 pts. Failed or bypassed OTP escalates return to manual review and requires photo evidence.", td_style)
        ],
        [
            Paragraph("<b>Profile & Member Barcode</b><br/><i>ProfilePage.jsx<br/>WishlistPage.jsx</i>", td_bold),
            Paragraph("Profile photo upload, saved delivery addresses, reward points ledger, saved wishlist, and <b>dynamic Member Barcode ID</b> for in-store/pickup scans.", td_style),
            Paragraph("Tracks customer tenure loyalty bonus (CP28). Accounts older than 6 months with verified deliveries receive an automatic -10 pts risk reduction.", td_style)
        ]
    ]
    shopper_table = Table(shopper_pages, colWidths=[110, 215, 215])
    shopper_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_alt]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(shopper_table)

    story.append(Spacer(1, 8))

    # =========================================================
    # 3. END-TO-END MERCHANT OPERATIONS: ALL TABS
    # =========================================================
    story.append(Paragraph("3. End-to-End Merchant Operations: Complete Tab Breakdown", h1_style))
    story.append(Paragraph(
        "The Merchant Portal provides store operators, fraud analysts, and warehouse teams complete visibility and surgical control "
        "over return requests, customer reputations, courier routes, and risk thresholds.", body_style
    ))

    merchant_tabs = [
        [Paragraph("<b>Merchant Portal Tab</b>", th_style), Paragraph("<b>Key Functions & Capabilities</b>", th_style), Paragraph("<b>Operational Impact & Data Surfaced</b>", th_style)],
        [
            Paragraph("<b>1. Merchant Dashboard</b><br/><i>MerchantDashboard.jsx</i>", td_bold),
            Paragraph("Executive command center displaying 6 core KPI cards: Total Orders, Overall Return Rate (%), Flagged Returns Pending Review, Total Fraud Prevented (₹), Revenue Saved, and Risk Tier Distribution.", td_style),
            Paragraph("Gives immediate snapshot of operational risk health, recent return spikes, and one-click deep links to urgent flagged cases.", td_style)
        ],
        [
            Paragraph("<b>2. Flagged Cases Queue</b><br/><i>MerchantFlaggedCases.jsx</i>", td_bold),
            Paragraph("Dedicated triage inbox for high-risk and critical returns. Filter by severity (Critical, High, Medium, Low) and status (Pending Review, Approved, Rejected, Hold). Real-time search by customer or order.", td_style),
            Paragraph("Highlights primary risk badges on cards: IMEI Mismatch, Product Swap, Wardrobing Spike, High Refund Ratio. Quick triage buttons for high-volume workflows.", td_style)
        ],
        [
            Paragraph("<b>3. Flagged Case Detail</b><br/><i>MerchantFlaggedCaseDetail.jsx</i>", td_bold),
            Paragraph("The core investigation engine. Contains 4 tabs: <b>Checkpoints Pipeline</b> (28 checkpoints visualizer), <b>Product Verification</b> (serial/swap alert card), <b>Customer Behavior</b> (stepper & restrictions), and <b>Similar Cases</b>.", td_style),
            Paragraph("Provides complete signal transparency: score breakdown bar, 6-step escalation stepper, and action panel (Approve, Reject, Hold, Restrict COD, Partial Refund).", td_style)
        ],
        [
            Paragraph("<b>4. Customer Intelligence</b><br/><i>MerchantCustomers.jsx</i>", td_bold),
            Paragraph("Directory of all store customers with search and risk filters. Tracks total orders, total spend, return frequency, COD refusal rate, linked device tokens, and active account restrictions.", td_style),
            Paragraph("Slide-out customer 360° drawer showing chronological purchase timeline, lifetime trust score, and active penalty tags (e.g., 'COD Blocked', 'Prepaid Only').", td_style)
        ],
        [
            Paragraph("<b>5. Orders Management</b><br/><i>MerchantOrders.jsx</i>", td_bold),
            Paragraph("Comprehensive order log showing Order ID, Customer, Items, Total Amount, Payment Method (COD vs Prepaid), Delivery Status, and <b>Risk Score at Checkout</b>.", td_style),
            Paragraph("Surfaces open-box delivery customer inspection confirmations and allows direct merchant download of signed invoice PDFs.", td_style)
        ],
        [
            Paragraph("<b>6. Products & Catalog</b><br/><i>MerchantProducts.jsx</i>", td_bold),
            Paragraph("Product inventory management with granular fraud parameters per SKU: Returnable toggle (Yes/No), Return Window duration (e.g., 3, 7, 15 days), Max Replacement count, and Serial/IMEI tracking requirement.", td_style),
            Paragraph("Enables strict gating for delicate or high-value items (e.g., forcing IMEI capture on phones; marking festive wear 3-day max return).", td_style)
        ],
        [
            Paragraph("<b>7. Delivery Agents & Collusion</b><br/><i>MerchantDeliveryAgents.jsx</i>", td_bold),
            Paragraph("Monitors logistics partners (Delhivery, BlueDart, Shadowfax, etc.) and individual delivery agents. Tracks delivery volume, return volume, return rate (%), and doorstep signature completion rate.", td_style),
            Paragraph("<b>Courier Collusion Alert:</b> Flags delivery agents whose routes exhibit abnormal clusters of missing items or swapped boxes, separating driver theft from customer fraud.", td_style)
        ],
        [
            Paragraph("<b>8. Fraud Configuration</b><br/><i>MerchantFraudConfig.jsx</i>", td_bold),
            Paragraph("Customizable risk threshold sliders (Low Max, Medium Max, Critical Min), checkpoint weight fine-tuning (adjust deltas for wardrobing, bracketing, etc.), and category-specific return policy overrides.", td_style),
            Paragraph("<b>List Rules Management:</b> Global merchant Whitelist (VIP trusted shoppers) and Blacklist (blocked phone numbers, fraudulent emails, flagged delivery pin codes).", td_style)
        ],
        [
            Paragraph("<b>9. Coupons & Discounts</b><br/><i>MerchantCoupons.jsx</i>", td_bold),
            Paragraph("Promotional discount code generator with abuse prevention rules: usage limits per customer, minimum cart spend, and exclusion of COD payment for coupon usage.", td_style),
            Paragraph("Prevents promo code farming and multiple account coupon exploitation by tying coupon redemption to verified device tokens.", td_style)
        ],
        [
            Paragraph("<b>10. Audit Trail Log</b><br/><i>MerchantAuditLog.jsx</i>", td_bold),
            Paragraph("Immutable, chronological record of every merchant and admin action. Logs Actor ID, Action Type (Approve Return, Reject, Restrict COD, Edit Weights), Target Case ID, Previous State, New State, and Justification.", td_style),
            Paragraph("Guarantees internal accountability, compliance with data privacy standards, and sanity-checking of automated self-tuning suggestions.", td_style)
        ],
        [
            Paragraph("<b>11. Analytics & Trends</b><br/><i>MerchantAnalytics.jsx</i>", td_bold),
            Paragraph("Deep reporting suite visualizing weekly return rates, category-wise fraud distribution (Ethnic vs Electronics vs Casual), financial fraud prevented (₹), and false-positive clearance rates.", td_style),
            Paragraph("Generates downloadable executive reports and self-tuning recommendations based on historical manual review outcomes.", td_style)
        ],
        [
            Paragraph("<b>12. Store Settings</b><br/><i>MerchantSettings.jsx<br/>MerchantOnboarding.jsx</i>", td_bold),
            Paragraph("Store profile, business GSTIN, tenant API token generation for the Chrome Browser Extension, webhook secret configuration, and email notification preferences.", td_style),
            Paragraph("Enables multi-store isolation; merchant admin tokens guarantee that API calls from extensions or third-party ERPs strictly query that specific tenant's data.", td_style)
        ]
    ]
    merchant_table = Table(merchant_tabs, colWidths=[110, 215, 215])
    merchant_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_accent),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_alt]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(merchant_table)

    story.append(Spacer(1, 8))

    # =========================================================
    # 4. DEEP DIVE: THE FLAGGED CASE REVIEW ENGINE
    # =========================================================
    story.append(Paragraph("4. Deep Dive: Flagged Case Detail & Decision Engine", h1_style))
    story.append(Paragraph(
        "When an order or return exceeds risk thresholds, it enters the <b>Flagged Case Detail View</b> (`MerchantFlaggedCaseDetail.jsx`). "
        "This view synthesizes 28 checkpoints, physical hardware comparisons, behavioral histories, and progressive escalation controls into an actionable cockpit.", body_style
    ))

    story.append(Paragraph("<b>The 6 Progressive Customer Escalation Steps:</b>", h2_style))
    story.append(Paragraph("• <b>Level 0 — Normal Ordering:</b> Standard shopping privileges; low risk; instant auto-approvals.", bullet_style))
    story.append(Paragraph("• <b>Level 1 — Warning & OTP:</b> Minor behavioral anomaly; customer must pass SMS OTP verification at checkout and return request.", bullet_style))
    story.append(Paragraph("• <b>Level 2 — COD Restricted:</b> Frequent COD refusal (>40%) or unverified return; Cash on Delivery is disabled; <b>Prepaid-only checkout enforced</b>.", bullet_style))
    story.append(Paragraph("• <b>Level 3 — Freeze + Review:</b> High risk of return fraud; all future returns are held for mandatory warehouse unboxing before refund disbursement.", bullet_style))
    story.append(Paragraph("• <b>Level 4 — Term Escalation:</b> Severe repeat offender; mandatory open-box delivery inspection and doorstep video unboxing required.", bullet_style))
    story.append(Paragraph("• <b>Level 5 — Final Account Ban:</b> Confirmed fraud / counterfeit swap; permanent account suspension and blacklist across device token and phone.", bullet_style))

    story.append(Paragraph("<b>Detailed Flagged Case Inspection Panels:</b>", h2_style))
    story.append(Paragraph("1. <b>Risk Score Breakdown Progress Bar:</b> Visualizes the stacked contribution of Type A (Eligibility), Type B (Physical), and Type C (Behavioral) signals out of 100 points.", body_style))
    story.append(Paragraph("2. <b>Product Swap Alert Card (`ProductSwapAlertCard.jsx`):</b> Critical alert triggered when warehouse inspects returned goods and identifies counterfeit units, swapped tags, or different SKUs. Displays swap details, original SKU vs received SKU, and warning badges.", body_style))
    story.append(Paragraph("3. <b>Serial / IMEI Mismatch Alert:</b> Side-by-side comparison of outbound serial number recorded at dispatch vs inbound serial number scanned at return. A mismatch triggers an automatic +50 pt critical spike and immediate hold.", body_style))
    story.append(Paragraph("4. <b>Packaging & Accessories Checklist:</b> Interactive warehouse checklist verifying box condition (original vs generic box), factory seal status (intact vs broken), and presence of high-value accessories (chargers, earphones, remotes).", body_style))
    story.append(Paragraph("5. <b>Doorstep Proof Viewer:</b> Displays courier-captured digital signature, geo-coordinates, pickup timestamp, and barcode scan logs verifying genuine physical custody handoff.", body_style))
    story.append(Paragraph("6. <b>Action Decision Panel:</b> Store operators can execute binding actions with a single click: <i>Approve Return, Reject Return with Reason, Hold Return for Warehouse Audit, Issue Partial Refund (deducting missing items), Restrict COD (for 30 days, 60 days, or permanent), or Escalate Account Level</i>.", body_style))

    story.append(Spacer(1, 8))

    # =========================================================
    # 5. THE 4-TIER RISK ENGINE & 28 CHECKPOINTS
    # =========================================================
    story.append(Paragraph("5. The 4-Tier Risk Engine: Full 28-Checkpoint Specification", h1_style))
    story.append(Paragraph(
        "ReturnGuard runs 28 deterministic checkpoints across four distinct evaluation tiers. This multi-layered architecture ensures that policy gates "
        "stop invalid returns early, physical product checks catch inventory theft, and behavioral analytics detect sophisticated fraud rings.", body_style
    ))

    cp_master = [
        [Paragraph("<b>ID & Tier</b>", th_style), Paragraph("<b>Checkpoint Name</b>", th_style), Paragraph("<b>Severity / Delta</b>", th_style), Paragraph("<b>Detection Logic & Fraud Mechanism</b>", th_style)],
        # Tier A
        [Paragraph("<b>CP26 [A]</b>", td_bold), Paragraph("Category-Specific Eligibility", td_style), Paragraph("GATE (Pass/Fail)", td_style), Paragraph("Pre-scoring gate. Hard blocks returns on non-returnable categories (intimate apparel, cosmetics, personal hygiene, final sale clearance items).", td_style)],
        [Paragraph("<b>CP24 [A]</b>", td_bold), Paragraph("Maximum Replacement Limits", td_style), Paragraph("GATE (Pass/Fail)", td_style), Paragraph("Pre-scoring gate. Enforces merchant policy limits on repeated replacement cycles (e.g., maximum 1 replacement per order item).", td_style)],
        # Tier B
        [Paragraph("<b>CP17b [B]</b>", td_bold), Paragraph("Serial / IMEI Mismatch", td_style), Paragraph("<b>+50 pts (CRITICAL)</b>", td_style), Paragraph("Outbound serialized electronics identifier differs from returned unit identifier. Flags product replacement scams.", td_style)],
        [Paragraph("<b>CP18 [B]</b>", td_bold), Paragraph("Missing Accessories Checklist", td_style), Paragraph("+15 pts (Medium)", td_style), Paragraph("Returned package is missing bundled items (power brick, USB cables, manual, accessories). Triggers partial refund deduction.", td_style)],
        [Paragraph("<b>CP19 [B]</b>", td_bold), Paragraph("Product Condition & Tamper", td_style), Paragraph("+20 pts (High)", td_style), Paragraph("Broken factory warranty seals, removed brand price tags, signs of washing, perfume scents, or altered fabric.", td_style)],
        [Paragraph("<b>CP20 [B]</b>", td_bold), Paragraph("Packaging & Box Mismatch", td_style), Paragraph("+20 pts (High)", td_style), Paragraph("Manufacturer original branded packaging replaced with generic brown box, damaged box, or mismatched serial label.", td_style)],
        [Paragraph("<b>CP21 [B]</b>", td_bold), Paragraph("Product Swap / Wrong Item", td_style), Paragraph("<b>+50 pts (CRITICAL)</b>", td_style), Paragraph("Returned physical merchandise is a counterfeit replica, older worn garment, or completely different product SKU.", td_style)],
        [Paragraph("<b>CP22 [B]</b>", td_bold), Paragraph("Return Quantity Mismatch", td_style), Paragraph("+20 pts (High)", td_style), Paragraph("Number of physical units received in return box is less than the quantity claimed on customer return form.", td_style)],
        # Tier C
        [Paragraph("<b>CP1 [C]</b>", td_bold), Paragraph("Frequent Size Exchanges", td_style), Paragraph("+10 pts (Medium)", td_style), Paragraph("Customer orders S, exchanges for M, then exchanges for L. Indicates sizing confusion or abuse of free exchanges.", td_style)],
        [Paragraph("<b>CP2 [C]</b>", td_bold), Paragraph("Multi-Size Bracketing", td_style), Paragraph("+15 pts (Medium)", td_style), Paragraph("Multiple sizes of the same apparel SKU ordered in a single checkout with historical intent to return the excess sizes.", td_style)],
        [Paragraph("<b>CP3 [C]</b>", td_bold), Paragraph("Repeated Size Switching", td_style), Paragraph("+15 pts (Medium)", td_style), Paragraph("Oscillating size selection across orders indicating multi-user account sharing or deliberate bracketing.", td_style)],
        [Paragraph("<b>CP4 [C]</b>", td_bold), Paragraph("Wardrobing Pattern Detection", td_style), Paragraph("+30 pts (High)", td_style), Paragraph("High-value ethnic/wedding wear purchased right before Diwali or wedding season and returned immediately post-event.", td_style)],
        [Paragraph("<b>CP5 [C]</b>", td_bold), Paragraph("High-Value Return Ratio", td_style), Paragraph("+15 pts (Medium)", td_style), Paragraph("Return request value significantly exceeds customer's historical average order value baseline.", td_style)],
        [Paragraph("<b>CP6 [C]</b>", td_bold), Paragraph("Immediate Post-Delivery Return", td_style), Paragraph("+10 pts (Low)", td_style), Paragraph("Return initiated within 15–30 minutes of delivery confirmation without reasonable time to unpack or inspect item.", td_style)],
        [Paragraph("<b>CP7 [C]</b>", td_bold), Paragraph("Return Near Policy Deadline", td_style), Paragraph("+5 pts (Low)", td_style), Paragraph("Return initiated on the final hours of day 7. Correlated with wardrobing and temporary usage patterns.", td_style)],
        [Paragraph("<b>CP8 [C]</b>", td_bold), Paragraph("Same Product Repeat Return", td_style), Paragraph("+15 pts (Medium)", td_style), Paragraph("Customer repeatedly orders and returns the identical product SKU across multiple separate transactions.", td_style)],
        [Paragraph("<b>CP9 [C]</b>", td_bold), Paragraph("Frequent Damage Claims", td_style), Paragraph("+25 pts (High)", td_style), Paragraph("Customer has high historical ratio of claiming products arrived broken, torn, or non-functional (>40% of orders).", td_style)],
        [Paragraph("<b>CP10 [C]</b>", td_bold), Paragraph("Damage Claim Without Photos", td_style), Paragraph("+20 pts (High)", td_style), Paragraph("Customer reports damaged goods but refuses or fails to upload photographic evidence during return creation.", td_style)],
        [Paragraph("<b>CP11 [C]</b>", td_bold), Paragraph("Return Reason Inconsistency", td_style), Paragraph("+10 pts (Medium)", td_style), Paragraph("Customer changes return reason during customer support interaction (e.g., switches from 'size issue' to 'damaged').", td_style)],
        [Paragraph("<b>CP12 [C]</b>", td_bold), Paragraph("Frequent Address Changes", td_style), Paragraph("+10 pts (Medium)", td_style), Paragraph("Rapid switching of delivery addresses across different cities or pin codes to circumvent local delivery blacklists.", td_style)],
        [Paragraph("<b>CP13 [C]</b>", td_bold), Paragraph("Multi-Account Device Sharing", td_style), Paragraph("+20 pts (High)", td_style), Paragraph("Same passive hardware/device token detected across multiple shopper accounts or telephone numbers.", td_style)],
        [Paragraph("<b>CP14 [C]</b>", td_bold), Paragraph("High Refund-to-Order Ratio", td_style), Paragraph("+25 pts (High)", td_style), Paragraph("Cumulative refund amount exceeds 50% of total lifetime purchase volume. Unprofitable serial returner.", td_style)],
        [Paragraph("<b>CP15 [C]</b>", td_bold), Paragraph("Seasonal Spike Correlation", td_style), Paragraph("+15 pts (Medium)", td_style), Paragraph("Orders placed during major holiday sales exhibiting return spikes immediately following festive dates.", td_style)],
        [Paragraph("<b>CP16 [C]</b>", td_bold), Paragraph("Prior Rejected Return Claims", td_style), Paragraph("+20 pts (High)", td_style), Paragraph("Customer has history of previous return requests that were formally rejected for policy violations or counterfeit goods.", td_style)],
        [Paragraph("<b>CP23 [C]</b>", td_bold), Paragraph("Duplicate Return Requests", td_style), Paragraph("+20 pts (High)", td_style), Paragraph("Submitting multiple simultaneous return claims for the same delivered order item to game automated refund triggers.", td_style)],
        [Paragraph("<b>CP25 [C]</b>", td_bold), Paragraph("Open-Box Delivery Verification", td_style), Paragraph("+15 pts (Medium)", td_style), Paragraph("Customer accepted item after open-box delivery inspection at doorstep but subsequently claims wrong product in box.", td_style)],
        [Paragraph("<b>CP27 [C]</b>", td_bold), Paragraph("Customer vs Product Benchmark", td_style), Paragraph("+15 pts (Medium)", td_style), Paragraph("Customer return rate on this SKU is 80% while global product return baseline across all shoppers is only 5%.", td_style)],
        [Paragraph("<b>CP28 [C]</b>", td_bold), Paragraph("Account Tenure Loyalty Bonus", td_style), Paragraph("<b>-10 pts (TRUST)</b>", td_style), Paragraph("<b>Trust Reduction:</b> Accounts older than 180 days with >5 successful kept deliveries receive automatic score deduction.", td_style)]
    ]
    cp_table = Table(cp_master, colWidths=[70, 130, 95, 245])
    cp_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_secondary),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_alt]),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(cp_table)

    story.append(Spacer(1, 8))

    # =========================================================
    # 6. DECISION MATRIX & VERIFICATION WORKFLOW
    # =========================================================
    story.append(Paragraph("6. Decision Matrix & Verification State Machine", h1_style))
    story.append(Paragraph(
        "Tier D synthesizes the net score (0–100) and maps it to operational outcomes. The merchant always retains ultimate authority, "
        "while the engine automates low-risk volume and applies strict gating to high-risk cases.", body_style
    ))

    dec_matrix = [
        [Paragraph("<b>Risk Tier</b>", th_style), Paragraph("<b>Score Range</b>", th_style), Paragraph("<b>System Outcome</b>", th_style), Paragraph("<b>Verification & Operational Action</b>", th_style)],
        [
            Paragraph("<b>Low Risk</b>", td_bold),
            Paragraph("0 – 34 pts", td_style),
            Paragraph("<b>Auto-Approved</b><br/>(Zero Friction)", td_style),
            Paragraph("Return approved instantly; return shipping label generated; refund queued upon doorstep barcode pickup.", td_style)
        ],
        [
            Paragraph("<b>Medium Risk</b>", td_bold),
            Paragraph("35 – 64 pts", td_style),
            Paragraph("<b>Step-Up Verification</b>", td_style),
            Paragraph("Triggers 6-digit SMS OTP challenge. Successful confirmation drops score by -15 pts. Failure routes to manual review.", td_style)
        ],
        [
            Paragraph("<b>High Risk</b>", td_bold),
            Paragraph("65 – 84 pts", td_style),
            Paragraph("<b>Manual Review / Gated</b>", td_style),
            Paragraph("Return held in flagged queue. Merchant can request photo evidence, require prepaid-only for future orders, or restrict COD.", td_style)
        ],
        [
            Paragraph("<b>Critical Risk</b>", td_bold),
            Paragraph("85 – 100 pts", td_style),
            Paragraph("<b>🚨 Immediate Hold</b>", td_style),
            Paragraph("Triggered by IMEI swap or counterfeit unit. Immediate refund freeze; mandatory physical inspection in warehouse; account flagged.", td_style)
        ]
    ]
    dec_table = Table(dec_matrix, colWidths=[75, 75, 130, 260])
    dec_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_alt]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(dec_table)

    story.append(Spacer(1, 8))

    # =========================================================
    # 7. TECHNICAL ARCHITECTURE & SECURITY
    # =========================================================
    story.append(Paragraph("7. Technical Architecture, Security & Multi-Tenancy", h1_style))
    story.append(Paragraph(
        "ReturnGuard is built with an enterprise multi-tenant design ensuring complete data isolation across competing D2C brands "
        "while maximizing developer velocity and operational reliability.", body_style
    ))
    story.append(Paragraph("• <b>PostgreSQL Row-Level Security (RLS) & Multi-Tenancy:</b> Every domain entity (Order, Product, Return, CustomerRiskProfile) carries a foreign key to <code>merchant_id</code>. Custom Django middleware automatically sets tenant context on every request, ensuring zero cross-tenant data leakage.", bullet_style))
    story.append(Paragraph("• <b>Single Source of Truth for Payments:</b> The payment service never trusts frontend messages. Payments are only marked <code>PAID</code> when verified by a signed webhook payload using HMAC SHA-256 signatures.", bullet_style))
    story.append(Paragraph("• <b>Asynchronous Task Queue (Celery + Redis):</b> Heavy workloads—including ReportLab PDF invoice generation, transactional email dispatch (SMTP/Resend), and risk analytics recalculation—are offloaded to background workers, keeping API response latency under 60ms.", bullet_style))
    story.append(Paragraph("• <b>Dual-Mode Frontend Architecture:</b> The React client features an intelligent abstraction layer that seamlessly switches between an instant in-memory Mock Store (for demos and testing) and the live Django REST API backend.", bullet_style))

    story.append(Spacer(1, 8))

    # =========================================================
    # 8. FUTURE SCOPE & CONCLUSION
    # =========================================================
    story.append(Paragraph("8. Future Scope & System Roadmap", h1_style))
    story.append(Paragraph("• <b>Edge Computer Vision (CV) for Doorstep Unboxing AI:</b> Mobile deep learning models deployed on courier handhelds to detect worn garments, missing tags, or counterfeit logos during physical pickup.", bullet_style))
    story.append(Paragraph("• <b>Cross-Merchant Consortium Fraud Graph:</b> Privacy-preserving cryptographic consortium network enabling independent D2C brands to collectively identify serial fraud rings operating across Shopify and WooCommerce stores.", bullet_style))
    story.append(Paragraph("• <b>Merchant Chrome Ops Extension (Manifest V3):</b> Lightweight browser toolbar extension providing live flagged-case count badges and one-click review actions directly inside existing store admin dashboards.", bullet_style))
    story.append(Paragraph("• <b>Automated UPI Penny-Drop & Escrow Reconciliation:</b> Direct integration with NPCI banking rails for instant bank verification and automated partial refund deductions for missing accessories.", bullet_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("9. Conclusion & Business Impact", h1_style))
    story.append(Paragraph(
        "<b>ReturnGuard</b> transforms return management from an uncontrolled margin drain into an automated, revenue-protecting asset. "
        "By pairing an intuitive shopper shopping and return flow with a high-intelligence merchant command portal and a deterministic 28-checkpoint risk engine, "
        "ReturnGuard delivers <b>60% to 70% reductions in return fraud</b>, recovers <b>15% to 20% in net margins</b>, and accelerates refunds for <b>90%+ of honest shoppers</b>.", body_style
    ))

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated complete project blueprint: {pdf_filename}")

if __name__ == "__main__":
    build_pdf()
