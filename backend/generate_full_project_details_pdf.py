import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
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
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages after cover)
        if self._pageNumber > 1:
            self.drawString(40, 760, "ReturnGuard — Complete Project & Architecture Specification")
            self.drawRightString(572, 760, "Shopper & Merchant Operations")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(40, 752, 572, 752)

        # Footer (all pages)
        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(572, 30, footer_text)
        self.drawString(40, 30, "CONFIDENTIAL & PROPRIETARY — RETURN GUARD TECHNOLOGIES")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(40, 42, 572, 42)
        self.restoreState()

def build_pdf():
    pdf_filename = "full prject detils.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    primary_color = colors.HexColor("#0f172a") # Slate 900
    accent_color = colors.HexColor("#4338ca")  # Indigo 700
    secondary_color = colors.HexColor("#1e293b")# Slate 800
    body_color = colors.HexColor("#334155")     # Slate 700

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=primary_color,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=accent_color,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=primary_color,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=accent_color,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=body_color,
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=body_color,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=body_color
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=primary_color
    )

    story = []

    # ---------------------------------------------------------
    # COVER / HEADER
    # ---------------------------------------------------------
    story.append(Spacer(1, 10))
    story.append(Paragraph("ReturnGuard — Complete Project & Architecture Blueprint", title_style))
    story.append(Paragraph("End-to-End System Specifications: Shopper Platform, Merchant Operations, 4-Tier Risk Engine, and Multi-Tenant Infrastructure", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=accent_color, spaceBefore=0, spaceAfter=12))

    # Meta Info Table
    meta_data = [
        [Paragraph("<b>Author / Platform:</b> ReturnGuard Engineering", table_cell_style),
         Paragraph("<b>Target Sector:</b> Indian E-Commerce (COD & D2C Brands)", table_cell_style)],
        [Paragraph("<b>Frontend:</b> React 18, Tailwind CSS, Lucide Icons, Vite", table_cell_style),
         Paragraph("<b>Backend:</b> Django 5.1, DRF, PostgreSQL, Celery, Redis", table_cell_style)],
        [Paragraph("<b>Status:</b> Production-Ready Architecture & Demo", table_cell_style),
         Paragraph("<b>Date / Version:</b> September 2026 | Release v2.4", table_cell_style)]
    ]
    meta_table = Table(meta_data, colWidths=[266, 266])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # ---------------------------------------------------------
    # 1. EXECUTIVE SUMMARY & PROBLEM LANDSCAPE
    # ---------------------------------------------------------
    story.append(Paragraph("1. Executive Summary & The Problem Landscape", h1_style))
    story.append(Paragraph(
        "Indian e-commerce is uniquely defined by <b>Cash-on-Delivery (COD)</b>, accounting for over 60% of all D2C retail orders. "
        "While COD minimizes consumer buying hesitation, it introduces severe operational vulnerabilities because purchases require zero upfront financial "
        "or identity commitment. Consequently, Indian online retailers suffer from return rates ranging from <b>30% to 45%</b> in apparel and lifestyle segments, "
        "compared to a global baseline of 15% to 20%.", body_style
    ))
    story.append(Paragraph(
        "<b>Core Vulnerabilities Addressed:</b>", h2_style
    ))
    story.append(Paragraph("• <b>Wardrobing (Wear & Return):</b> Consumers purchase high-value ethnic or festive attire for weddings or Diwali, use it once, and return it post-event citing changed mind.", bullet_style))
    story.append(Paragraph("• <b>Size Bracketing & Serial Over-Ordering:</b> Shoppers order 3–4 sizes of the same garment intending to keep one and return the rest, forcing merchants to absorb double-trip logistics.", bullet_style))
    story.append(Paragraph("• <b>Product & SKU Swapping:</b> Counterfeits, worn items, or older variants returned in place of newly shipped high-value items (Checkpoints CP17b & CP21).", bullet_style))
    story.append(Paragraph("• <b>Enterprise Tool Pricing Gap:</b> Global anti-fraud software (Signifyd, Riskified) costs upwards of $20,000/year and focuses on credit card chargebacks. Small-to-mid D2C brands ($50K–$5M ARR) are left defenseless.", bullet_style))
    story.append(Paragraph("• <b>The ReturnGuard Mission:</b> Provide an affordable, COD-native, full e-commerce ecosystem with automated real-time risk scoring, zero friction for genuine buyers, and impenetrable barriers against serial fraudsters.", bullet_style))

    story.append(Spacer(1, 8))

    # ---------------------------------------------------------
    # 2. END-TO-END SHOPPER JOURNEY
    # ---------------------------------------------------------
    story.append(Paragraph("2. End-to-End Shopper Journey (Customer Experience)", h1_style))
    story.append(Paragraph(
        "ReturnGuard was built under the philosophy of <i>'Frictionless by Default'</i>. Honest shoppers (85%+ of the user base) enjoy an intuitive, frictionless modern shopping experience without intrusive CAPTCHAs or interrogation. Step-up security is dynamically invoked only when behavioral anomalies appear.", body_style
    ))

    shopper_flow_data = [
        [Paragraph("<b>Shopper Stage</b>", table_header_style), Paragraph("<b>Platform Mechanism & Experience</b>", table_header_style), Paragraph("<b>Fraud & Risk Safeguards</b>", table_header_style)],
        [
            Paragraph("<b>1. Authentication</b>", table_cell_bold),
            Paragraph("Email/Password or 1-Click Google OAuth sign-in. Profile stores delivery addresses, orders, and barcodes.", table_cell_style),
            Paragraph("Silent client device fingerprint token generated and associated with profile for reuse tracking.", table_cell_style)
        ],
        [
            Paragraph("<b>2. Catalog & Cart</b>", table_cell_bold),
            Paragraph("Rich product discovery by category, price filtering, variant selection (size/color), and live inventory check.", table_cell_style),
            Paragraph("Category returnability rules checked (CP26: intimate/perishable non-returnable flags surfaced transparently).", table_cell_style)
        ],
        [
            Paragraph("<b>3. Dynamic Checkout</b>", table_cell_bold),
            Paragraph("Seamless checkout supporting COD, UPI (PhonePe, GPay), Credit/Debit Cards, NetBanking, and Mobile Banking.", table_cell_style),
            Paragraph("If customer has high historical COD refusal (>50%), COD option is automatically restricted to Prepaid-only.", table_cell_style)
        ],
        [
            Paragraph("<b>4. Order Confirmation & Invoicing</b>", table_cell_bold),
            Paragraph("Immediate confirmation screen with real-time tracking number, estimated delivery, and instant downloadable PDF Tax Invoice.", table_cell_style),
            Paragraph("Webhook-verified payment confirmation; atomic transactions ensure stock deduction consistency.", table_cell_style)
        ],
        [
            Paragraph("<b>5. Return Request Initiation</b>", table_cell_bold),
            Paragraph("Self-service return button in Order History within 7-day window. Customer selects reason and item lines.", table_cell_style),
            Paragraph("Real-time pre-scoring gates: policy window, replacement count (CP24), and category eligibility enforced.", table_cell_style)
        ],
        [
            Paragraph("<b>6. Step-Up Verification</b>", table_cell_bold),
            Paragraph("If return is Low Risk: <b>Instant Auto-Approval</b>.<br/>If Medium Risk: SMS OTP challenge sent to registered phone.", table_cell_style),
            Paragraph("Successful OTP lowers risk score by -15 pts. Unverified or high-risk cases routed to manual review queue.", table_cell_style)
        ],
        [
            Paragraph("<b>7. Doorstep Logistics Handshake</b>", table_cell_bold),
            Paragraph("Customer hands package to pickup courier agent. No complex customer self-attestation needed.", table_cell_style),
            Paragraph("Courier agent captures geo-stamped digital signature and scans item barcode/IMEI directly at the door.", table_cell_style)
        ]
    ]
    shopper_table = Table(shopper_flow_data, colWidths=[100, 232, 200])
    shopper_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(shopper_table)

    story.append(Spacer(1, 10))

    # ---------------------------------------------------------
    # 3. END-TO-END MERCHANT OPERATIONS & ADMIN PORTAL
    # ---------------------------------------------------------
    story.append(Paragraph("3. End-to-End Merchant Operations & Admin Portal", h1_style))
    story.append(Paragraph(
        "The Merchant Portal is an enterprise-grade command center providing total operational control over orders, return requests, risk thresholds, and logistics agents without needing technical engineering support.", body_style
    ))
    story.append(Paragraph("• <b>Live Flagged-Returns Review Queue:</b> Real-time triage dashboard displaying flagged high-risk and critical returns with composite scores (0–100), urgency badges, and quick triage actions.", bullet_style))
    story.append(Paragraph("• <b>28-Checkpoint Inspection Visualizer:</b> Every flagged return features a card breakdown visualizing all evaluated signals, severity levels (Pass/Low/Medium/High/Critical), and point deltas.", bullet_style))
    story.append(Paragraph("• <b>Customer 360° Behavioral Intelligence:</b> Merchant views complete buyer history including total order value, refund-to-order ratio, historical damage claims, and linked device identifiers.", bullet_style))
    story.append(Paragraph("• <b>Delivery Agent & Courier Route Collusion Monitoring:</b> Tracks return rates per delivery partner. Flags routes or drivers with statistically abnormal return loss clusters (e.g., driver swapping items en route).", bullet_style))
    story.append(Paragraph("• <b>Dynamic Fraud Rules & Weight Customizer:</b> Merchants can adjust point weights and risk thresholds (Low Max, Medium Max, Critical Min) to match their specific product margin tolerance.", bullet_style))
    story.append(Paragraph("• <b>Direct Action Controls:</b> Single-click decision buttons: <i>Accept Order, Reject Order, Require Prepaid, Restrict COD, Request Photo Proof, Hold Return for Warehouse Audit, or Suspend Customer Account</i>.", bullet_style))
    story.append(Paragraph("• <b>Immutable Audit Trail:</b> Every approval, rejection, or policy override is logged with admin user ID, timestamp, and justification to prevent internal operator fraud.", bullet_style))

    story.append(Spacer(1, 10))

    # ---------------------------------------------------------
    # 4. SYSTEM ARCHITECTURE & TECH STACK
    # ---------------------------------------------------------
    story.append(Paragraph("4. System Architecture & Complete Technology Stack", h1_style))
    
    arch_data = [
        [Paragraph("<b>Component Layer</b>", table_header_style), Paragraph("<b>Technologies Used</b>", table_header_style), Paragraph("<b>Architectural Responsibility</b>", table_header_style)],
        [
            Paragraph("<b>Frontend Client</b>", table_cell_bold),
            Paragraph("React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion", table_cell_style),
            Paragraph("Responsive dual-mode SPA (Shopper + Merchant), dual Mock/Live API client, client device telemetry, QR/barcode generation.", table_cell_style)
        ],
        [
            Paragraph("<b>Backend API Core</b>", table_cell_bold),
            Paragraph("Python 3.12, Django 5.1, Django REST Framework (DRF)", table_cell_style),
            Paragraph("Multi-tenant REST API, atomic checkout service, 4-tier fraud scoring engine, SimpleJWT tokens, Google OAuth 2.0.", table_cell_style)
        ],
        [
            Paragraph("<b>Database & Storage</b>", table_cell_bold),
            Paragraph("PostgreSQL 16, Row-Level Security (RLS), S3-compatible Object Storage", table_cell_style),
            Paragraph("Tenant-isolated relational schemas via merchant_id, audit logging, encrypted proof storage (digital signatures, images).", table_cell_style)
        ],
        [
            Paragraph("<b>Asynchronous Tasks</b>", table_cell_bold),
            Paragraph("Celery 5.4, Redis 7 (Message Broker & Result Backend)", table_cell_style),
            Paragraph("Non-blocking background invoice PDF generation, transactional email dispatch (Resend/SMTP), heavy analytics aggregation.", table_cell_style)
        ],
        [
            Paragraph("<b>Security & Verification</b>", table_cell_bold),
            Paragraph("HMAC SHA-256 Webhooks, MSG91/Twilio OTP, Penny-Drop API", table_cell_style),
            Paragraph("Single-source-of-truth webhook payment validation, rate-limited step-up SMS OTP challenges, bank account verification.", table_cell_style)
        ]
    ]
    arch_table = Table(arch_data, colWidths=[100, 180, 252])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), accent_color),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(arch_table)

    story.append(Spacer(1, 10))

    # ---------------------------------------------------------
    # 5. THE 4-TIER RISK ENGINE & THE 28 CHECKPOINTS
    # ---------------------------------------------------------
    story.append(Paragraph("5. The 4-Tier Risk Engine & The 28 Checkpoints", h1_style))
    story.append(Paragraph(
        "The core innovation of ReturnGuard is its <b>4-Tier Composite Risk Scoring Engine</b>. Rather than relying on opaque black-box machine learning "
        "that small merchants cannot understand or defend in customer disputes, ReturnGuard executes <b>28 deterministic, weighted checkpoints</b> in sequence.", body_style
    ))

    checkpoints_summary_data = [
        [Paragraph("<b>Tier & ID</b>", table_header_style), Paragraph("<b>Checkpoint Name</b>", table_header_style), Paragraph("<b>Default Impact / Delta</b>", table_header_style), Paragraph("<b>Evaluation Logic & Fraud Signal</b>", table_header_style)],
        # Tier A
        [Paragraph("<b>Tier A: CP26</b>", table_cell_bold), Paragraph("Category-Specific Eligibility", table_cell_style), Paragraph("Hard Pass/Fail Gate", table_cell_style), Paragraph("Blocks returns on non-returnable categories (intimate apparel, cosmetics, personal hygiene, final sale).", table_cell_style)],
        [Paragraph("<b>Tier A: CP24</b>", table_cell_bold), Paragraph("Maximum Replacement Limits", table_cell_style), Paragraph("Hard Pass/Fail Gate", table_cell_style), Paragraph("Enforces merchant policy limit on consecutive product replacements (e.g., maximum 1 replacement allowed).", table_cell_style)],
        # Tier B
        [Paragraph("<b>Tier B: CP17b</b>", table_cell_bold), Paragraph("Serial / IMEI Mismatch", table_cell_style), Paragraph("+50 pts (CRITICAL)", table_cell_style), Paragraph("Triggered when returned electronics serial/IMEI differs from outbound shipment. Flagged for immediate hold.", table_cell_style)],
        [Paragraph("<b>Tier B: CP18</b>", table_cell_bold), Paragraph("Missing Accessories Checklist", table_cell_style), Paragraph("+15 pts (Medium)", table_cell_style), Paragraph("Evaluates missing cables, manuals, power adapters; deducts restocking fee from refund.", table_cell_style)],
        [Paragraph("<b>Tier B: CP19</b>", table_cell_bold), Paragraph("Product Condition & Tamper", table_cell_style), Paragraph("+20 pts (High)", table_cell_style), Paragraph("Detects broken manufacturer seals, missing brand tags, signs of wash/perfume, or physical alteration.", table_cell_style)],
        [Paragraph("<b>Tier B: CP20</b>", table_cell_bold), Paragraph("Packaging & Box Mismatch", table_cell_style), Paragraph("+20 pts (High)", table_cell_style), Paragraph("Original branded box substituted with generic cardboard box or damaged beyond merchant resale viability.", table_cell_style)],
        [Paragraph("<b>Tier B: CP21</b>", table_cell_bold), Paragraph("Product Swap / Wrong Item", table_cell_style), Paragraph("+50 pts (CRITICAL)", table_cell_style), Paragraph("Customer returns a completely different SKU, counterfeit unit, or empty filler material in place of item.", table_cell_style)],
        [Paragraph("<b>Tier B: CP22</b>", table_cell_bold), Paragraph("Return Quantity Mismatch", table_cell_style), Paragraph("+20 pts (High)", table_cell_style), Paragraph("Number of physical units received in box is lower than claimed units requested on return form.", table_cell_style)],
        # Tier C Sample Highlights
        [Paragraph("<b>Tier C: CP1-3</b>", table_cell_bold), Paragraph("Size Exchange & Bracketing", table_cell_style), Paragraph("+10 to +15 pts", table_cell_style), Paragraph("Tracks frequent size swaps (CP1), multi-variant ordering in 1 cart (CP2), and repetitive size switching (CP3).", table_cell_style)],
        [Paragraph("<b>Tier C: CP4</b>", table_cell_bold), Paragraph("Wardrobing Detection", table_cell_style), Paragraph("+30 pts (High)", table_cell_style), Paragraph("Correlates high-value ethnic wear returns immediately following Diwali, Eid, or regional wedding seasons.", table_cell_style)],
        [Paragraph("<b>Tier C: CP5-8</b>", table_cell_bold), Paragraph("Value & Velocity Patterns", table_cell_style), Paragraph("+10 to +20 pts", table_cell_style), Paragraph("High refund value vs. historical average (CP5), immediate return <1 hr of delivery (CP6), repeat SKU return (CP8).", table_cell_style)],
        [Paragraph("<b>Tier C: CP9-11</b>", table_cell_bold), Paragraph("Damage Claim Anomalies", table_cell_style), Paragraph("+10 to +25 pts", table_cell_style), Paragraph("High frequency of claimed transit defects (CP9), no photographic proof (CP10), reason modification (CP11).", table_cell_style)],
        [Paragraph("<b>Tier C: CP12-16</b>", table_cell_bold), Paragraph("Identity & History Risks", table_cell_style), Paragraph("+10 to +25 pts", table_cell_style), Paragraph("Frequent address switching (CP12), multi-account device sharing (CP13), refund ratio >50% (CP14).", table_cell_style)],
        [Paragraph("<b>Tier C: CP28</b>", table_cell_bold), Paragraph("Customer Tenure Loyalty Bonus", table_cell_style), Paragraph("-10 pts (TRUST BONUS)", table_cell_style), Paragraph("Accounts older than 6 months with >5 successful non-returned deliveries receive an automatic score reduction.", table_cell_style)]
    ]
    checkpoints_table = Table(checkpoints_summary_data, colWidths=[80, 140, 110, 202])
    checkpoints_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), secondary_color),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(checkpoints_table)

    story.append(Spacer(1, 10))

    # ---------------------------------------------------------
    # 6. DECISION MATRIX & ESCALATION PATHS
    # ---------------------------------------------------------
    story.append(Paragraph("6. Decision Matrix & Verification State Machine", h1_style))
    story.append(Paragraph(
        "Tier D of the engine compiles the net score (0–100) and maps it to operational actions. The merchant always retains ultimate authority, while the system automates low-risk throughput and safeguards high-risk thresholds.", body_style
    ))

    decision_data = [
        [Paragraph("<b>Risk Tier</b>", table_header_style), Paragraph("<b>Score Range</b>", table_header_style), Paragraph("<b>Default System Outcome</b>", table_header_style), Paragraph("<b>Merchant Operations & Escalation Path</b>", table_header_style)],
        [
            Paragraph("<b>Low Risk</b>", table_cell_bold),
            Paragraph("0 – 34", table_cell_style),
            Paragraph("<b>Auto-Approved</b> (Zero Friction)", table_cell_style),
            Paragraph("Return label generated instantly; refund queued automatically upon doorstep barcode scan.", table_cell_style)
        ],
        [
            Paragraph("<b>Medium Risk</b>", table_cell_bold),
            Paragraph("35 – 64", table_cell_style),
            Paragraph("<b>Step-Up Verification</b>", table_cell_style),
            Paragraph("Dispatches SMS OTP challenge. Successful confirmation deducts -15 pts from score. Failure routes to review.", table_cell_style)
        ],
        [
            Paragraph("<b>High Risk</b>", table_cell_bold),
            Paragraph("65 – 84", table_cell_style),
            Paragraph("<b>Manual Review / Gating</b>", table_cell_style),
            Paragraph("Flagged in admin queue. Merchant options: require photo proof, restrict future orders to Prepaid-only, restrict COD.", table_cell_style)
        ],
        [
            Paragraph("<b>Critical Risk</b>", table_cell_bold),
            Paragraph("85 – 100", table_cell_style),
            Paragraph("<b>🚨 Immediate Hold</b>", table_cell_style),
            Paragraph("Triggered by IMEI mismatch or product swap. Immediate refund freeze; mandatory physical inspection in warehouse.", table_cell_style)
        ]
    ]
    decision_table = Table(decision_data, colWidths=[70, 70, 160, 232])
    decision_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(decision_table)

    story.append(Spacer(1, 10))

    # ---------------------------------------------------------
    # 7. TECHNICAL CHALLENGES OVERCOME & SOLUTIONS
    # ---------------------------------------------------------
    story.append(Paragraph("7. Technical Challenges Overcome & Engineering Solutions", h1_style))
    story.append(Paragraph("1. <b>Friction vs. Conversion Dilemma:</b> Overly aggressive anti-fraud systems drive cart abandonment among legitimate buyers. <i>Solution:</i> Passive-first telemetry and historical reputation scoring; over 85% of shoppers complete purchase and returns with zero security friction.", body_style))
    story.append(Paragraph("2. <b>The COD Verification Void:</b> Cash-on-Delivery provides no credit card pre-authorization hold or bank identity anchor. <i>Solution:</i> Seamless cross-referencing of client device tokens, phone numbers, and past address completion rates, paired with Penny-Drop validation on repeat offenders.", body_style))
    story.append(Paragraph("3. <b>Doorstep Custody Disputes:</b> Disagreements where shoppers claim they returned authentic goods while warehouses claim boxes arrived empty. <i>Solution:</i> Logistics-anchored verification: Pickup drivers capture a geo-stamped digital signature and scan the item's barcode/IMEI at the customer doorstep.", body_style))
    story.append(Paragraph("4. <b>Multi-Tenant Isolation & Security:</b> Ensuring strict data partitioning across competing retail brands hosted on shared infrastructure. <i>Solution:</i> Django tenant middleware enforcing scoped querysets combined with PostgreSQL Row-Level Security (RLS) indexed by merchant_id.", body_style))

    story.append(Spacer(1, 10))

    # ---------------------------------------------------------
    # 8. FUTURE SCOPE & ROADMAP
    # ---------------------------------------------------------
    story.append(Paragraph("8. Future Scope & System Roadmap", h1_style))
    story.append(Paragraph("• <b>Computer Vision & Edge Unboxing AI:</b> Deploying lightweight deep learning models on couriers' mobile devices to scan garments for worn fabric, detached tags, or counterfeit logos during doorstep pickup.", bullet_style))
    story.append(Paragraph("• <b>Cross-Merchant Consortium Fraud Graph:</b> Building a privacy-preserving cryptographic consortium ledger across independent D2C merchants to detect serial fraud rings hopping across stores.", bullet_style))
    story.append(Paragraph("• <b>Merchant Chrome Ops Extension (Manifest V3):</b> Dedicated browser toolbar extension enabling store owners to triage flagged cases directly within Shopify or WooCommerce admin panels.", bullet_style))
    story.append(Paragraph("• <b>Automated UPI Penny-Drop & Escrow Reconciliation:</b> Integrating instant automated penny-drop validation with dynamic restocking fee deductions for damaged packaging or missing accessories.", bullet_style))

    story.append(Spacer(1, 10))

    # ---------------------------------------------------------
    # 9. CONCLUSION
    # ---------------------------------------------------------
    story.append(Paragraph("9. Conclusion", h1_style))
    story.append(Paragraph(
        "<b>ReturnGuard</b> bridges the multi-million dollar fraud gap in Indian e-commerce by turning reverse logistics from an uncontrolled cost center "
        "into an automated, secure, and revenue-protecting asset. By combining an intuitive shopper-facing checkout experience, a high-intelligence merchant command portal, "
        "and a 4-tier, 28-checkpoint risk engine, ReturnGuard enables D2C brands to slash return fraud by up to <b>60%–70%</b> while elevating customer trust and operational efficiency.", body_style
    ))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated: {pdf_filename}")

if __name__ == "__main__":
    build_pdf()
