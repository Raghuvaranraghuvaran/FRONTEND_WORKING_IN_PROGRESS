import os
import sys
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def create_presentation_pdf():
    pdf_filename = "ReturnGuard_Presentation.pdf"
    
    # 11 x 8.5 inches landscape (792 x 612 pt)
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=landscape(letter),
        leftMargin=36,
        rightMargin=36,
        topMargin=24,
        bottomMargin=24
    )

    styles = getSampleStyleSheet()
    
    # Brand Colors - Light Theme
    c_light_bg = colors.HexColor("#F8FAFC")
    c_card_bg = colors.HexColor("#FFFFFF")
    c_hero_bg = colors.HexColor("#F1F5F9")
    c_teal = colors.HexColor("#0D9488")
    c_indigo = colors.HexColor("#4338CA")
    c_text_dark = colors.HexColor("#0F172A")
    c_text_muted = colors.HexColor("#475569")
    c_border = colors.HexColor("#CBD5E1")
    c_critical = colors.HexColor("#DC2626")

    # Typography Styles - Light Theme
    title_cover = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=42,
        leading=48,
        textColor=c_text_dark,
        alignment=1,
        spaceAfter=14
    )

    subtitle_cover = ParagraphStyle(
        'CoverSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=16,
        leading=22,
        textColor=c_text_muted,
        alignment=1,
        spaceAfter=28
    )

    meta_cover = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=18,
        textColor=c_text_dark,
        alignment=1
    )

    h1_slide = ParagraphStyle(
        'SlideH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=17,
        leading=21,
        textColor=c_text_dark,
        spaceAfter=0
    )

    badge_slide_num = ParagraphStyle(
        'SlideBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        textColor=c_teal,
        alignment=0
    )

    card_h1 = ParagraphStyle(
        'CardH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13.5,
        textColor=c_text_dark,
        spaceAfter=5
    )

    card_h1_teal = ParagraphStyle(
        'CardH1Teal',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13.5,
        textColor=c_teal,
        spaceAfter=5
    )

    card_h1_indigo = ParagraphStyle(
        'CardH1Ind',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13.5,
        textColor=c_indigo,
        spaceAfter=5
    )

    card_h1_crit = ParagraphStyle(
        'CardH1Crit',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13.5,
        textColor=c_critical,
        spaceAfter=5
    )

    body_txt = ParagraphStyle(
        'BodyTxt',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=c_text_dark,
        spaceAfter=4
    )

    caption_txt = ParagraphStyle(
        'CapTxt',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.2,
        leading=9.5,
        textColor=c_text_muted,
        alignment=1,
        spaceBefore=3,
        spaceAfter=3
    )

    def make_left_header(title_text, slide_label):
        """Header with slide label on the left side (no 'of X') with top accent stripe."""
        header_table = Table([
            [Paragraph(f"<b>{slide_label.upper()}</b>", badge_slide_num)],
            [Paragraph(title_text, h1_slide)]
        ], colWidths=[720])
        header_table.setStyle(TableStyle([
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ('LINEBELOW', (0,1), (0,1), 2, c_teal),
        ]))
        return header_table

    base_dir = os.path.abspath("screenshots")
    img_landing = os.path.join(base_dir, "real_landing_page.png")
    img_shopper_dash = os.path.join(base_dir, "shopper_dashboard.png")
    img_dashboard = os.path.join(base_dir, "3_merchant_dashboard.png")
    img_flagged_queue = os.path.join(base_dir, "4_flagged_cases_queue.png")
    img_case_detail = os.path.join(base_dir, "5_flagged_case_detail_28checkpoints.png")
    img_tech_logos = os.path.join(base_dir, "tech_stack", "official_tech_logos.png")

    story = []

    # =============================================================
    # SLIDE 1: TITLE SLIDE (LIGHT BACKGROUND TEMPLATE)
    # =============================================================
    s1_top = Table([
        [Paragraph("<b>SLIDE 1</b>", badge_slide_num)]
    ], colWidths=[720], style=[('LEFTPADDING', (0,0), (-1,-1), 0), ('RIGHTPADDING', (0,0), (-1,-1), 0)])

    s1_elements = [
        s1_top,
        Spacer(1, 65),
        Paragraph("ReturnGuard", title_cover),
        Paragraph("An Intelligent, COD-Native Risk Defense System for Indian D2C Commerce", subtitle_cover),
        Spacer(1, 20),
        Paragraph("<font color='#0D9488'>Project Team: Team ReturnGuard</font> &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp; <b>Mentor Name: Thavayee</b>", meta_cover),
        Spacer(1, 75)
    ]

    s1_wrapper = Table([[s1_elements]], colWidths=[720])
    s1_wrapper.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_card_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 25),
        ('BOTTOMPADDING', (0,0), (-1,-1), 25),
        ('LEFTPADDING', (0,0), (-1,-1), 30),
        ('RIGHTPADDING', (0,0), (-1,-1), 30),
    ]))
    story.append(s1_wrapper)
    story.append(PageBreak())

    # =============================================================
    # SLIDE 2: PROJECT OVERVIEW (REPLACED WITH STOREFRONT LANDING PAGE)
    # =============================================================
    s2_left = [
        Paragraph("<b>CORE SYSTEM CAPABILITIES & VALUE</b>", card_h1),
        Paragraph("<b>• Problem Context in Indian D2C:</b> Cash-on-Delivery (COD) accounts for 60%+ of orders, causing severe exposure where merchants pay 3x forward freight on abusive returns.", body_txt),
        Paragraph("<b>• Dual-Portal Ecosystem:</b> Unified application integrating a customer shopping storefront and a merchant operations triage center.", body_txt),
        Paragraph("<b>• Real-Time Scoring Engine:</b> Evaluates every order and return from <b>0 to 100 points</b> using passive device telemetry, history, and physical product checks.", body_txt),
        Paragraph("<b>• Target Beneficiaries:</b> Built for small-to-mid Indian D2C brands (<b>$50K–$5M ARR</b>) in apparel, lifestyle, and electronics.", body_txt),
        Paragraph("<b>• Frictionless by Default:</b> <b>85%+ of genuine orders & returns are auto-approved instantly</b> with zero customer friction; step-up checks trigger only on anomalies.", body_txt),
        Paragraph("<b>• Strategic Value:</b> Converts reverse logistics from an uncontrolled margin drain into a secure, revenue-protecting operational asset.", body_txt),
    ]
    s2_right = [
        Image(img_landing, width=340, height=200) if os.path.exists(img_landing) else Paragraph("Landing Page Screenshot", body_txt),
        Paragraph("Live Application Screen: Storefront Landing Page & Shopper Commerce Experience", caption_txt),
    ]
    s2_table = Table([[s2_left, s2_right]], colWidths=[365, 355])
    s2_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), c_card_bg),
        ('BOX', (0,0), (0,0), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))

    story.append(make_left_header("PROJECT OVERVIEW", "SLIDE 2"))
    story.append(s2_table)
    story.append(PageBreak())

    # =============================================================
    # SLIDE 3: SHOPPER & MERCHANT PLATFORM DASHBOARDS
    # =============================================================
    s3_shop_content = [
        Image(img_shopper_dash, width=345, height=135) if os.path.exists(img_shopper_dash) else Paragraph("Shopper Dashboard", body_txt),
        Paragraph("Shopper Portal: Order History, Reward Points & 1-Click Return/Exchange Hub", caption_txt),
        Paragraph("<b>SHOPPER STOREFRONT & SELF-SERVICE PORTAL</b>", card_h1_indigo),
        Paragraph("<b>• 1-Click Return Initiation:</b> Frictionless self-service return and exchange requests directly from customer order history.", body_txt),
        Paragraph("<b>• Automated Smart Exchanges:</b> Recommends instant size/color swaps over cash refunds, reducing reverse freight while preserving the sale.", body_txt),
        Paragraph("<b>• Real-Time Timeline Tracking:</b> Live status updates on pickup scheduling, doorstep courier inspection, and refund processing.", body_txt),
        Paragraph("<b>• Instant Friction-Free Approvals:</b> <b>85%+ of genuine returns</b> auto-cleared immediately with zero administrative delays.", body_txt),
    ]

    s3_merch_content = [
        Image(img_dashboard, width=345, height=135) if os.path.exists(img_dashboard) else Paragraph("Merchant Dashboard", body_txt),
        Paragraph("Merchant Portal: Executive Risk KPIs, Flagged Returns Queue & Fraud Triage", caption_txt),
        Paragraph("<b>MERCHANT OPERATIONS COMMAND CENTER</b>", card_h1_teal),
        Paragraph("<b>• Executive KPI Surveillance:</b> Real-time visibility into overall return rates, prevented fraud loss values, and risk tier distributions.", body_txt),
        Paragraph("<b>• Algorithmic Anomaly Triage:</b> Automated 0–100 scoring funneling suspicious claims into a prioritized review queue.", body_txt),
        Paragraph("<b>• Configurable Fraud Policy:</b> Dynamic sliders to adjust sensitivity per product category, festive wardrobing rules, and serial tracking.", body_txt),
        Paragraph("<b>• Custody Chain & Logistics:</b> Doorstep digital witnessing, courier photo verification, and delivery agent collusion analytics.", body_txt),
    ]

    s3_table = Table([[s3_shop_content, s3_merch_content]], colWidths=[355, 355])
    s3_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_card_bg),
        ('BOX', (0,0), (0,0), 0.5, c_border),
        ('BOX', (1,0), (1,0), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))

    story.append(make_left_header("PLATFORM ARCHITECTURE: SHOPPER & MERCHANT DASHBOARDS", "SLIDE 3"))
    story.append(s3_table)
    story.append(PageBreak())

    # =============================================================
    # SLIDE 4: CHALLENGES & PRACTICAL SOLUTIONS
    # =============================================================
    s4_left = [
        Paragraph("<b>FRAUD CHALLENGES & ENGINEERING SOLUTIONS</b>", card_h1),
        Paragraph("<b>• Challenge 1 — Wardrobing & Festive Rental Abuse:</b> Shoppers purchase high-value ethnic apparel for weddings/Diwali, wear once, and return for full refunds.<br/><b>&nbsp;&nbsp;→ Solution (CP4):</b> Automated festive calendar risk tightening, mandatory tag-intact verification, and pre-return condition checks.", body_txt),
        Paragraph("<b>• Challenge 2 — Size Bracketing Multi-Orders:</b> Buyers order 3–4 sizes of the same SKU to try at home and return the rest, inflating reverse freight by 300%.<br/><b>&nbsp;&nbsp;→ Solution (CP10):</b> Cart-level multi-size detection with instant size exchange incentives over cash returns.", body_txt),
        Paragraph("<b>• Challenge 3 — Electronics Hardware Swapping:</b> High-value electronics returned with missing accessories, clone devices, or dummy ballast weights.<br/><b>&nbsp;&nbsp;→ Solution (CP17):</b> Mandatory serial/IMEI verification between dispatch and return with +50 pt critical risk flagging.", body_txt),
        Paragraph("<b>• Challenge 4 — Courier & Driver Collusion:</b> Delivery drivers falsely marking items as 'customer rejected' or siphoning returned goods en route.<br/><b>&nbsp;&nbsp;→ Solution (CP24):</b> Geo-stamped doorstep signatures, tamper-evident seals, and driver route anomaly analytics.", body_txt),
    ]
    s4_right = [
        Image(img_flagged_queue, width=340, height=200) if os.path.exists(img_flagged_queue) else Paragraph("Flagged Queue Screenshot", body_txt),
        Paragraph("Live Application Screen: Flagged Cases Queue (Actionable Risk Scoring & Resolution Workflow)", caption_txt),
    ]
    s4_table = Table([[s4_left, s4_right]], colWidths=[365, 355])
    s4_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), c_card_bg),
        ('BOX', (0,0), (0,0), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))

    story.append(make_left_header("CHALLENGES & SOLUTIONS", "SLIDE 4"))
    story.append(s4_table)
    story.append(PageBreak())

    # =============================================================
    # SLIDE 5: KEY FEATURES
    # =============================================================
    s5_left = [
        Paragraph("<b>KEY IMPLEMENTED ARCHITECTURAL FEATURES</b>", card_h1),
        Paragraph("<b>• Customer & Risk Profile Context:</b> Real-time shopper telemetry displaying customer identity, order history, active return rate, and flagged risk tier (High Risk • 78 pts).", body_txt),
        Paragraph("<b>• 5-Step Return & Risk Engine:</b> Automated lifecycle progression: <b>Return Requested → Pickup Scheduled → Product Inspection → Risk Evaluation → Merchant Decision</b>.", body_txt),
        Paragraph("<b>• 1-Click Merchant Decision Panel:</b> Direct operational actions: <b>Approve Refund</b>, <b>Store Credit (+5%)</b>, <b>Replacement</b>, <b>Hold</b>, <b>Reject</b>, or <b>Reject + Restrict</b>.", body_txt),
        Paragraph("<b>• 4-Tier / 28 Risk Checkpoints:</b> Comprehensive evaluation pipeline covering Pre-Scoring Gates, Physical Attributes, Behavioral Biometrics, and Composite Decision Rules.", body_txt),
        Paragraph("<b>• 6-Level Escalation Ladder:</b> Proportionate customer friction scaling from instant auto-approval to OTP challenge, COD lock, and account termination.", body_txt),
        Paragraph("<b>• Full Audit & Case Documentation:</b> Structured decision notes capture and immutable audit logging for fraud disputes and chargeback defense.", body_txt),
    ]
    s5_right = [
        Image(img_case_detail, width=340, height=200) if os.path.exists(img_case_detail) else Paragraph("Case Detail Screenshot", body_txt),
        Paragraph("Live Application Screen: Flagged Case Review (Customer Profile, 5-Step Return Engine & Decision Panel)", caption_txt),
    ]
    s5_table = Table([[s5_left, s5_right]], colWidths=[365, 355])
    s5_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), c_card_bg),
        ('BOX', (0,0), (0,0), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))

    story.append(make_left_header("KEY FEATURES", "SLIDE 5"))
    story.append(s5_table)
    story.append(PageBreak())

    # =============================================================
    # SLIDE 6: TECHNOLOGY STACK
    # =============================================================
    s6_top = [
        Image(img_tech_logos, width=460, height=105) if os.path.exists(img_tech_logos) else Paragraph("Tech Logos", body_txt),
    ]
    s6_top_table = Table([[s6_top]], colWidths=[720], style=[('ALIGN', (0,0), (-1,-1), 'CENTER'), ('TOPPADDING', (0,0), (-1,-1), 0), ('BOTTOMPADDING', (0,0), (-1,-1), 6)])

    s6_l = [
        Paragraph("<b>FRONTEND & CLIENT ARCHITECTURE</b>", card_h1_teal),
        Paragraph("<b>• React & Vite SPA:</b> Modular component architecture powering both shopper storefront and merchant command center with hot module replacement.", body_txt),
        Paragraph("<b>• Tailwind CSS Design System:</b> Modern utility styling delivering responsive layouts, risk status badges, and accessible tables.", body_txt),
        Paragraph("<b>• Lucide React Icons & Context API:</b> Clean SVG iconography with lightweight global state management for auth, cart, and alerts.", body_txt),
        Paragraph("<b>• Resilient API Client:</b> Axios HTTP layer featuring automatic JWT token refreshing and error boundary fallback states.", body_txt),
    ]
    s6_r = [
        Paragraph("<b>BACKEND, DATABASE & TASK PIPELINE</b>", card_h1_indigo),
        Paragraph("<b>• Python & Django REST Framework:</b> Robust RESTful API architecture running the 28-checkpoint scoring algorithm with sub-second execution.", body_txt),
        Paragraph("<b>• PostgreSQL with Row-Level Security:</b> Relational database with strict tenant isolation, foreign keys, and ACID compliance.", body_txt),
        Paragraph("<b>• Redis & Celery Worker Queue:</b> Distributed asynchronous background pipeline handling risk scoring and automated alerts.", body_txt),
        Paragraph("<b>• Security & Invoicing Engine:</b> HMAC SHA-256 webhook signatures, encrypted telemetry, and ReportLab PDF invoice generation.", body_txt),
    ]
    s6_bot_table = Table([[s6_l, s6_r]], colWidths=[355, 355])
    s6_bot_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_card_bg),
        ('BOX', (0,0), (0,0), 0.5, c_border),
        ('BOX', (1,0), (1,0), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))

    story.append(make_left_header("TECHNOLOGY STACK", "SLIDE 6"))
    story.append(s6_top_table)
    story.append(s6_bot_table)
    story.append(PageBreak())

    # =============================================================
    # SLIDE 7: CONCLUSION
    # =============================================================
    s7_l = [
        Paragraph("<b>CORE SYSTEM DELIVERABLES</b>", card_h1),
        Paragraph("<b>• Complete Working Platform:</b> Dual-portal e-commerce application integrating a customer storefront with a real-time merchant operations command portal.", body_txt),
        Paragraph("<b>• 28 Algorithmic Checkpoints:</b> Comprehensive multi-tier scoring pipeline analyzing behavioral, cultural, physical, and logistics checks.", body_txt),
        Paragraph("<b>• 6-Level Escalation Ladder:</b> Dynamic, proportional friction scaling from automated approval to doorstep OTP, COD restriction, and blacklisting.", body_txt),
        Paragraph("<b>• Production API Architecture:</b> Scalable Django REST backend with asynchronous task workers and PostgreSQL Row-Level Security isolation.", body_txt),
        Paragraph("<b>• Full Audit & Case History:</b> Immutable tracking logs capturing every risk signal, customer action, and merchant resolution.", body_txt),
    ]
    s7_r = [
        Paragraph("<b>BUSINESS VALUE & QUANTIFIED IMPACT</b>", card_h1_teal),
        Paragraph("<b>• 85%+ Instant Approvals:</b> Genuine customers experience zero friction with instant auto-approval on legitimate orders and return claims.", body_txt),
        Paragraph("<b>• 70% Cut in Wardrobing Abuse:</b> Cultural and seasonal calendar rules eliminate organized festive garment rental fraud during weddings and festivals.", body_txt),
        Paragraph("<b>• Reverse Freight Recovery:</b> Eliminates unnecessary 3x forward logistics fees on abusive multi-size orders and merchandise swapping.", body_txt),
        Paragraph("<b>• Protects Merchant Margin:</b> Empowers small-to-mid Indian D2C retailers to offer safe COD payments without risking inventory bankruptcy.", body_txt),
        Paragraph("<b>• Granular Policy Customization:</b> Store operators can adjust risk sensitivity sliders dynamically per product category to optimize margins.", body_txt),
    ]
    s7_table = Table([[s7_l, s7_r]], colWidths=[355, 355])
    s7_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_card_bg),
        ('BOX', (0,0), (0,0), 0.5, c_border),
        ('BOX', (1,0), (1,0), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))

    story.append(make_left_header("CONCLUSION", "SLIDE 7"))
    story.append(s7_table)
    story.append(PageBreak())

    # =============================================================
    # SLIDE 8: FUTURE SCOPE
    # =============================================================
    s8_c1 = [
        Paragraph("<b>1. MOBILE EDGE COMPUTER VISION</b>", card_h1_indigo),
        Paragraph("<b>• Real-Time Doorstep Scanning:</b> Deploy lightweight on-device AI vision models to couriers' handheld devices for real-time fabric texture analysis, tag integrity verification, and wear detection prior to acceptance.", body_txt),
    ]
    s8_c2 = [
        Paragraph("<b>2. CONSORTIUM FRAUD GRAPH NETWORK</b>", card_h1_teal),
        Paragraph("<b>• Cross-Merchant Identity Mesh:</b> Privacy-preserving zero-knowledge graph network that pools anonymized risk telemetry across independent Indian D2C stores to preemptively flag serial fraudsters.", body_txt),
    ]
    s8_c3 = [
        Paragraph("<b>3. MANIFEST V3 CHROME OPS EXTENSION</b>", card_h1),
        Paragraph("<b>• Embedded E-Commerce Integration:</b> Browser toolbar extension injecting ReturnGuard's 0-100 risk badges and 1-click triage buttons directly inside Shopify, WooCommerce, and Magento order management panels.", body_txt),
    ]
    s8_c4 = [
        Paragraph("<b>4. AUTOMATED UPI PENNY-DROP & REFUNDS</b>", card_h1_crit),
        Paragraph("<b>• Frictionless Micro-Settlements:</b> Algorithmic bank account verification via ₹1 NPCI UPI penny-drops, enabling automated fractional payouts and dynamic deductions for missing product accessories or tags.", body_txt),
    ]

    s8_table = Table([
        [s8_c1, s8_c2],
        [s8_c3, s8_c4]
    ], colWidths=[355, 355])
    s8_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_card_bg),
        ('BOX', (0,0), (0,0), 0.5, c_border),
        ('BOX', (1,0), (1,0), 0.5, c_border),
        ('BOX', (0,1), (0,1), 0.5, c_border),
        ('BOX', (1,1), (1,1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))

    story.append(make_left_header("FUTURE SCOPE", "SLIDE 8"))
    story.append(s8_table)
    story.append(PageBreak())

    # =============================================================
    # SLIDE 9: THANK YOU (LIGHT BACKGROUND TEMPLATE)
    # =============================================================
    s9_top = Table([
        [Paragraph("<b>SLIDE 9</b>", badge_slide_num)]
    ], colWidths=[720], style=[('LEFTPADDING', (0,0), (-1,-1), 0), ('RIGHTPADDING', (0,0), (-1,-1), 0)])

    s9_elements = [
        s9_top,
        Spacer(1, 80),
        Paragraph("THANK YOU", ParagraphStyle('TY9Light', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=52, leading=58, textColor=c_text_dark, alignment=1)),
        Spacer(1, 14),
        Paragraph("ReturnGuard: AI-Assisted Return-Fraud Detection Platform", ParagraphStyle('TY9SubLight', parent=styles['Normal'], fontName='Helvetica', fontSize=18, leading=22, textColor=c_text_muted, alignment=1)),
        Spacer(1, 24),
        Paragraph("<font color='#0D9488'><b>Open for Questions, Architectural Inquiries & Technical Discussion</b></font>", ParagraphStyle('TY9DiscLight', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=13, leading=17, textColor=c_teal, alignment=1)),
        Spacer(1, 80)
    ]

    s9_wrapper = Table([[s9_elements]], colWidths=[720])
    s9_wrapper.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_card_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 30),
        ('BOTTOMPADDING', (0,0), (-1,-1), 30),
        ('LEFTPADDING', (0,0), (-1,-1), 30),
        ('RIGHTPADDING', (0,0), (-1,-1), 30),
    ]))
    story.append(s9_wrapper)

    doc.build(story)
    print(f"Successfully generated updated 9-slide presentation PDF: {pdf_filename}")

if __name__ == "__main__":
    create_presentation_pdf()
