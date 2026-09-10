import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(40, 11 * inch - 30, "RETURN GUARD — Intelligent Fraud Prevention System")
            self.drawRightString(8.5 * inch - 40, 11 * inch - 30, "Demo Presentation & Viva Guide")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(40, 11 * inch - 34, 8.5 * inch - 40, 11 * inch - 34)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(40, 38, 8.5 * inch - 40, 38)
        self.drawString(40, 26, "CONFIDENTIAL — College Project Live Demo & Viva Preparation")
        self.drawRightString(8.5 * inch - 40, 26, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=46,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_primary = colors.HexColor("#0F172A")    # Deep Slate / Navy
    c_accent = colors.HexColor("#2563EB")     # Tech Blue
    c_emerald = colors.HexColor("#059669")    # Green
    c_amber = colors.HexColor("#D97706")      # Amber
    c_rose = colors.HexColor("#E11D48")       # Rose / Red
    c_text = colors.HexColor("#1E293B")       # Dark Charcoal
    c_muted = colors.HexColor("#475569")      # Muted slate
    c_card_bg = colors.HexColor("#F8FAFC")    # Clean slate bg
    c_card_border = colors.HexColor("#E2E8F0")

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=c_primary,
        alignment=0
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=c_accent,
        alignment=0
    )
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=c_muted
    )
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=c_primary,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=c_accent,
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=c_text
    )
    body_bold = ParagraphStyle(
        'Body_Bold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    script_style = ParagraphStyle(
        'Script_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#1E3A8A")
    )
    badge_style = ParagraphStyle(
        'Badge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9,
        textColor=colors.white
    )

    story = []

    # Title Banner Block
    banner_data = [
        [
            Paragraph("DEMO PRESENTATION GUIDE", title_style),
            Paragraph("<b>College Viva & Live Demo Guide</b><br/>Project: Return Guard", meta_style)
        ],
        [
            Paragraph("RETURN GUARD — Intelligent Fraud Prevention System", subtitle_style),
            Paragraph("<b>Version:</b> 2.4 Production Ready<br/><b>Scope:</b> Shopper & Merchant Flows", meta_style)
        ]
    ]
    banner_table = Table(banner_data, colWidths=[5.0 * inch, 2.3 * inch])
    banner_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(banner_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_accent, spaceBefore=6, spaceAfter=10))

    # Helper function for Section Heading
    def add_section_header(num, title):
        head_data = [[
            Paragraph(f"<b>{num}. {title.upper()}</b>", h1_style)
        ]]
        t = Table(head_data, colWidths=[7.3 * inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LINELEFT', (0, 0), (-1, -1), 3.5, c_accent),
        ]))
        story.append(Spacer(1, 4))
        story.append(t)
        story.append(Spacer(1, 6))

    # Helper function for Tab Block Card
    def add_tab_card(tab_name, url_path, what_does, what_demo, what_say):
        card_content = [
            [
                Paragraph(f"<b>{tab_name}</b> <font color='#64748B' size='7.5'>({url_path})</font>", h2_style)
            ],
            [
                Paragraph(f"<b>What this tab does:</b> {what_does}", body_style)
            ],
            [
                Paragraph(f"<b>What to demonstrate:</b> {what_demo}", body_style)
            ],
            [
                Paragraph(f"<b>What to say (Live Script):</b><br/><i>“{what_say}”</i>", script_style)
            ]
        ]
        t = Table(card_content, colWidths=[7.15 * inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), c_card_bg),
            ('BOX', (0, 0), (-1, -1), 0.7, c_card_border),
            ('LINELEFT', (0, 0), (-1, -1), 3, colors.HexColor("#3B82F6")),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(KeepTogether([t, Spacer(1, 5)]))

    # ==================== SECTION 1: DEMO INTRODUCTION ====================
    add_section_header("1", "Demo Introduction (30–45 Seconds Spoken Pitch)")
    
    intro_p = Paragraph(
        "<b>Presenter Spoken Script:</b><br/>"
        "<i>“Good morning, respected evaluators. Today, we are presenting <b>Return Guard</b>, an intelligent fraud prevention and risk management platform for e-commerce.<br/><br/>"
        "Retailers lose billions annually to fraudulent returns—such as wardrobing, serial swapping, empty-box claims, and courier fraud. Traditional platforms treat every return the same, causing either massive financial loss or alienating honest shoppers.<br/><br/>"
        "Return Guard bridges the <b>Shopper</b> and <b>Merchant</b> through a real-time risk engine. When a customer orders or returns an item, the system analyzes historical frequency, item value, serial telemetry, and doorstep checks to generate an instant <b>Risk Score (0–100)</b>. High-risk cases are automatically escalated for merchant audit with graduated penalties, while trusted shoppers enjoy frictionless, instant approvals.<br/><br/>"
        "Let us begin with a live walkthrough of the Shopper portal.”</i>",
        script_style
    )
    intro_box = Table([[intro_p]], colWidths=[7.3 * inch])
    intro_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#EFF6FF")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#BFDBFE")),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(intro_box)
    story.append(Spacer(1, 10))

    # ==================== SECTION 2: SHOPPER SIDE LIVE DEMO GUIDE ====================
    add_section_header("2", "Shopper Side — Live Demo Guide (Every Tab & Page)")

    shopper_tabs = [
        (
            "1. Landing Page / Storefront Home",
            "/",
            "Introduces Return Guard's trust features, secure shopping guarantee, and dual navigation for shoppers and merchants.",
            "Show the hero banner, trust metrics (Instant Refunds, AI Shield), and click 'Shop Now' or login as a registered buyer.",
            "This is our Landing Page. It introduces customers to Return Guard's trusted shopping ecosystem. From here, users can seamlessly browse the consumer store or switch over to merchant operations."
        ),
        (
            "2. Shop / Product Catalog",
            "/shop",
            "Displays all available inventory with search, category filtering, sort options, and intelligent size/comparison tools.",
            "Filter by category (Electronics, Fashion), demonstrate search, and show the 'AI Size Advisor' and 'Compare' buttons.",
            "This is the Product Catalog where shoppers browse items. Notice that each item clearly displays its return eligibility window. We also offer an AI Size Advisor to prevent wardrobing and size-bracketing right at the browsing stage."
        ),
        (
            "3. Product Details Page",
            "/products/:productId",
            "Provides full specifications, warranty duration, serial verification notices, and inventory availability.",
            "Open a high-value item (like Sony Headphones or Smartphone), point out the serial verification badge, and click 'Add to Cart'.",
            "On the Product Details page, shoppers see specifications and return terms. For serialized electronics, Return Guard informs buyers that serial verification applies upon delivery and return, establishing transparency from day one."
        ),
        (
            "4. Cart & Pre-Order Guard",
            "/cart",
            "Calculates cart subtotals and actively validates cart combinations for multi-variant size-bracketing patterns.",
            "Show the cart summary, coupon field, and highlight the Bracketing Alert badge if multiple variants of an item are selected.",
            "In the Cart, Return Guard monitors buying patterns. If a user adds multiple sizes of the same garment with the intent to return most of them, an advisory prompt encourages our size guide, preventing avoidable returns before dispatch."
        ),
        (
            "5. Checkout & Payment Security",
            "/checkout",
            "Collects shipping address, validates postal zones, and dynamically toggles COD vs Prepaid based on customer risk tier.",
            "Fill demo shipping details, toggle between Payment Methods (Card/UPI vs COD), and show risk-based COD eligibility.",
            "This is the Checkout page. Shoppers enter delivery details and choose payment. Notice that if an account has a history of high doorstep refusals, Return Guard can automatically restrict COD to protect the store from transit losses."
        ),
        (
            "6. Shopper Dashboard",
            "/dashboard",
            "Gives customers an overview of active orders, return quota limits, reward loyalty points, and verified Trust Tier.",
            "Point out the Trust Tier badge, remaining return quota balance, loyalty reward points, and quick links to recent orders.",
            "Here is the Shopper Dashboard. It rewards honest customers with a high Trust Tier and loyalty points. Shoppers can clearly track their return quota and monitor all ongoing purchase activities in one transparent place."
        ),
        (
            "7. My Orders",
            "/orders",
            "Lists all past and active orders with delivery tracking progress bars, OTP delivery cancellation, and return links.",
            "Show orders categorized by status (Delivered, Shipped). Click on a delivered order to reveal the 'Request Return' button.",
            "The My Orders page displays the customer's full purchase history. For delivered items within the policy window, customers can initiate a return with a single click, launching our guided 4-step Return Wizard."
        ),
        (
            "8. Guided Return Request Wizard",
            "/orders/:orderId/return",
            "A structured 4-step wizard that captures return reasons, serial numbers, photographic proof, and refund preferences.",
            "Walk through: Step 1 (Reason), Step 2 (Serial verification & item condition), Step 3 (Upload photo proof), Step 4 (Select Refund/Store Credit).",
            "This is the 4-step Return Wizard. Instead of a simple text box, we require specific return reasons, serial confirmation, and photo proof. This ensures clear digital evidence before any return authorization is issued."
        ),
        (
            "9. Return Live Tracker & Doorstep OTP",
            "/returns/:returnId/track",
            "Displays live progress across 5 return milestones and provides a secure Doorstep Pickup OTP for courier handoff.",
            "Show the active milestone progress bar (Requested → Approved → Pickup Scheduled → In Transit → Inspected & Refunded) and pickup OTP.",
            "Once a return is initiated, the shopper tracks it live here. Return Guard issues a Doorstep Verification OTP that the customer must provide to the courier at pickup, preventing courier tampering or false pickup claims."
        ),
        (
            "10. Wishlist & Price Watch",
            "/wishlist",
            "Stores saved products for future purchase with automated price drop alerts and stock updates.",
            "Show saved items and how easily items can be moved directly into the shopping cart.",
            "The Wishlist allows customers to curate items they intend to buy. It keeps shoppers engaged without adding unnecessary impulse orders that often lead to returns."
        ),
        (
            "11. Notifications Hub",
            "/notifications",
            "Provides instant alerts on order updates, return approvals, risk flags, and refund disbursements.",
            "Click the notification bell icon to reveal real-time status updates and refund confirmations.",
            "The Notifications Hub keeps shoppers updated in real time. Whenever a merchant approves a return or releases a refund, the customer receives an immediate confirmation message."
        ),
        (
            "12. Shopper Profile & Trust Standing",
            "/profile",
            "Displays personal information, saved addresses, account security settings, and Return Guard Trust Rating.",
            "Show the user profile, trust score badge (e.g., Verified Low Risk), and security configuration.",
            "The Profile page summarizes account credentials and verified standing. High trust ratings unlock instant refunds, whereas accounts with repeated policy violations will see their restricted status here."
        )
    ]

    for name, path, does, demo, say in shopper_tabs:
        add_tab_card(name, path, does, demo, say)

    # ==================== SECTION 3: SHOPPER WORKFLOW ====================
    add_section_header("3", "Shopper End-to-End Workflow (Step-by-Step Live Demo)")

    wf_shopper_data = [
        [
            Paragraph("<b>Step & Action</b>", body_bold),
            Paragraph("<b>What to Click & What Happens</b>", body_bold),
            Paragraph("<b>Presenter Spoken Script (1–3 Lines)</b>", body_bold)
        ],
        [
            Paragraph("<b>Step 1: Product Selection</b><br/>Shop (`/shop`)", body_style),
            Paragraph("Click a high-value item (e.g., Sony WH-1000XM5) and click <b>Add to Cart</b>.<br/><i>Item is added; return eligibility is verified.</i>", body_style),
            Paragraph("<i>“First, the shopper selects an eligible product from the catalog. The system verifies its category and return terms.”</i>", script_style)
        ],
        [
            Paragraph("<b>Step 2: Cart Validation</b><br/>Cart (`/cart`)", body_style),
            Paragraph("Click Cart icon. Review items and proceed.<br/><i>Cart validates for multi-variant size-bracketing patterns.</i>", body_style),
            Paragraph("<i>“In the cart, Return Guard verifies item combinations. If no abusive purchasing pattern is detected, the shopper proceeds cleanly.”</i>", script_style)
        ],
        [
            Paragraph("<b>Step 3: Secure Checkout</b><br/>Checkout (`/checkout`)", body_style),
            Paragraph("Fill address, select payment, and click <b>Place Order</b>.<br/><i>Order is stored in DB with order ID, items, and status 'Delivered'.</i>", body_style),
            Paragraph("<i>“The shopper completes checkout. The order is stored in the database with timestamps and shipping coordinates.”</i>", script_style)
        ],
        [
            Paragraph("<b>Step 4: Request Return</b><br/>Orders (`/orders`)", body_style),
            Paragraph("Locate the delivered order and click <b>Request Return</b>.<br/><i>Opens the structured 4-step Return Request Wizard.</i>", body_style),
            Paragraph("<i>“When the item is delivered, the customer has the option to request a return if there is an issue.”</i>", script_style)
        ],
        [
            Paragraph("<b>Step 5: Wizard & Photo Proof</b><br/>Wizard (`/orders/:id/return`)", body_style),
            Paragraph("Select reason ('Damaged'), input mismatched serial number, upload photo, click <b>Submit Return</b>.<br/><i>Fraud Engine computes Risk Score in background.</i>", body_style),
            Paragraph("<i>“The customer completes the return wizard with photo proof and serial confirmation. Return Guard instantly evaluates the return signals in the background.”</i>", script_style)
        ],
        [
            Paragraph("<b>Final Result: Tracking & OTP</b><br/>Tracker (`/returns/:id/track`)", body_style),
            Paragraph("View active return tracking page.<br/><i>Displays 5-milestone timeline and secure Doorstep Pickup OTP.</i>", body_style),
            Paragraph("<i>“The shopper now has full visibility of the return lifecycle and a pickup OTP for courier verification.”</i>", script_style)
        ]
    ]

    t_wf_s = Table(wf_shopper_data, colWidths=[1.8 * inch, 2.7 * inch, 2.8 * inch])
    t_wf_s.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_wf_s)
    story.append(Spacer(1, 10))

    # ==================== SECTION 4: MERCHANT SIDE LIVE DEMO GUIDE ====================
    add_section_header("4", "Merchant Side — Live Demo Guide (Every Tab & Page)")

    merchant_tabs = [
        (
            "1. Merchant Dashboard",
            "/merchant",
            "Serves as the executive command center displaying Loss Prevention ROI, Pending Return Audits, and Risk Tier distributions.",
            "Point to the top KPI cards (Loss Prevented in ₹, Pending Audits), the Risk Tier chart, and click 'Review Flagged Cases'.",
            "This is the Merchant Dashboard. It gives store owners instant visibility into their return health and fraud savings. Notice the Risk Tier distribution and the queue of pending return audits requiring merchant attention."
        ),
        (
            "2. Flagged Cases & Return Audits",
            "/merchant/flagged-cases",
            "Displays the prioritized review queue of suspicious returns flagged by Return Guard's scoring engine.",
            "Show the list of cases with Risk Scores (e.g., 85/100), risk badges, customer names, and filter by Risk Tier (High/Medium/Low).",
            "This is the Flagged Cases queue—the heart of Return Guard's merchant operations. Every return that exceeds the merchant’s risk threshold is automatically caught here with its calculated risk score, eliminating manual guesswork."
        ),
        (
            "3. Case Detail & Resolution Room",
            "/merchant/flagged-cases/:caseId",
            "Provides deep forensic evidence: customer return history, photo inspection, serial verification, and progressive directives.",
            "Show the uploaded photos, serial mismatch warning, the 5-Step Escalation Ladder, and decision buttons (Approve, Reject, Hold).",
            "Here in the Case Resolution Room, the merchant examines forensic evidence: uploaded photos, serial matching, and past frequency. The merchant can issue progressive directives—like enforcing OTP or blocking COD—or make an immediate Approve/Reject decision."
        ),
        (
            "4. Orders Management",
            "/merchant/orders",
            "Tracks all customer purchases across fulfillment stages, manages deliveries, and logs doorstep refusals.",
            "Show the orders table, click 'Record Doorstep Refusal' on a COD order, or update fulfillment status to Delivered.",
            "The Orders Management tab tracks all customer purchases. Merchants can log doorstep delivery refusals here, which feeds directly into Return Guard's algorithm to catch chronic COD abuse."
        ),
        (
            "5. Products Catalog & Inventory",
            "/merchant/products",
            "Manages inventory items, supports bulk CSV product imports, and identifies items with abnormal return rates.",
            "Show product listings, click 'Bulk Import CSV', and highlight return-rate badges on individual items.",
            "In Products Catalog, merchants manage inventory and catalog settings. Return Guard flags items that suffer abnormally high return rates, alerting merchants to potential supplier defects or sizing mismatches."
        ),
        (
            "6. Customers Directory & Risk Profiles",
            "/merchant/customers",
            "Lists all registered shoppers with their cumulative spend, return rate percentage, and cross-merchant trust score.",
            "Search for a customer, show their Return Ratio, Trust Badge (Low / Medium / High Risk), and return history.",
            "The Customers Directory provides a holistic risk profile for every buyer. Merchants can identify habitual return abusers and see whether a customer has cross-store return violations across the network."
        ),
        (
            "7. Delivery Agents & Courier Telemetry",
            "/merchant/delivery-agents",
            "Monitors third-party couriers, tracks courier anomaly gaps (time between pickup & intake scan), and investigates transit theft.",
            "Show courier partner cards (BlueDart, Delhivery), the anomaly gap indicator, and click 'Sign-Off Investigation'.",
            "Return Guard doesn't just evaluate shoppers—it tracks courier telemetry. This tab highlights discrepancies between doorstep pickups and warehouse intake scans, exposing internal courier theft or missing return packages."
        ),
        (
            "8. Coupons & Promotions",
            "/merchant/coupons",
            "Configures promo codes, usage limits, and minimum cart thresholds to prevent coupon abuse and refund loopholes.",
            "Show active coupon codes, usage metrics, and create a coupon with anti-fraud restrictions.",
            "Here the merchant manages promotional discount codes. Return Guard ensures that refunded orders properly reconcile promotional discounts so abusers cannot exploit coupon loopholes."
        ),
        (
            "9. Fraud Engine Configuration & VIP Lists",
            "/merchant/fraud-config",
            "Empowers merchants to adjust the 5 scoring weights, tune risk thresholds, and manage VIP Whitelists and Blacklists.",
            "Adjust the Weight Sliders (Frequency, Value, Serial, COD, Behavioral), edit thresholds, and view VIP customer lists.",
            "In Fraud Configuration, merchants have total control over the scoring engine. They can tune weights for high-value goods or serial verification, set risk thresholds, and whitelist loyal VIPs from automated blocks."
        ),
        (
            "10. Analytics & Self-Tuning ML",
            "/merchant/analytics",
            "Visualizes long-term financial trends, return volumes by category, and displays AI self-tuning recommendation cards.",
            "Point out the Monthly Return Trend chart, Category Loss breakdown, and the 'Self-Tuning Suggestions' panel.",
            "The Analytics tab visualizes long-term trends and fraud patterns. Our self-tuning engine analyzes historical outcomes and recommends optimal threshold adjustments to minimize both fraud and false positives."
        ),
        (
            "11. Immutable Audit Log",
            "/merchant/audit-log",
            "Maintains an unalterable, chronological log of every merchant decision, override, rule change, and timestamp.",
            "Show the chronological feed with actor names, action types (e.g., 'Rejected Case #102'), and timestamps.",
            "This is the Immutable Audit Log. Every action taken by a merchant—whether approving a refund, blocking COD, or changing weights—is permanently recorded with timestamps for compliance and dispute resolution."
        ),
        (
            "12. Store Settings & Onboarding",
            "/merchant/settings",
            "Configures store profile details, return policy grace periods (e.g., 7 vs 15 days), webhooks, and API keys.",
            "Show the return policy duration setting, store contact information, and integration status.",
            "Finally, Store Settings allows merchants to customize store policies, grace periods, and API integrations with existing e-commerce storefronts like Shopify or WooCommerce."
        )
    ]

    for name, path, does, demo, say in merchant_tabs:
        add_tab_card(name, path, does, demo, say)

    # ==================== SECTION 5: MERCHANT WORKFLOW ====================
    add_section_header("5", "Merchant End-to-End Workflow (Step-by-Step Live Demo)")

    wf_merchant_data = [
        [
            Paragraph("<b>Step & Action</b>", body_bold),
            Paragraph("<b>What to Click & What Appears</b>", body_bold),
            Paragraph("<b>Presenter Spoken Script (1–3 Lines)</b>", body_bold)
        ],
        [
            Paragraph("<b>Step 1: Dashboard KPI Review</b><br/>Dashboard (`/merchant`)", body_style),
            Paragraph("Open Merchant Dashboard. Review Loss Prevention ROI and Pending Reviews count. Click <b>Review Flagged Cases</b>.<br/><i>Navigates to prioritized queue.</i>", body_style),
            Paragraph("<i>“The merchant begins their shift on the dashboard, noting 3 pending high-risk returns requiring audit.”</i>", script_style)
        ],
        [
            Paragraph("<b>Step 2: Priority Queue Selection</b><br/>Queue (`/merchant/flagged-cases`)", body_style),
            Paragraph("Locate Case `#102` (Risk Score: 85/100). Click <b>Inspect Case</b>.<br/><i>Loads forensic resolution room with customer history and evidence.</i>", body_style),
            Paragraph("<i>“The merchant opens the priority queue and selects the highest-risk case—a high-value smartphone return with a risk score of 85.”</i>", script_style)
        ],
        [
            Paragraph("<b>Step 3: Forensic Inspection</b><br/>Case Room (`/merchant/flagged-cases/102`)", body_style),
            Paragraph("Inspect uploaded photo proof and serial matching badge.<br/><i>Displays Serial Mismatch alert (Original: S/N-9982 vs Returned: S/N-1044).</i>", body_style),
            Paragraph("<i>“The merchant inspects the evidence: the customer returned a photo with a mismatched serial number, and their account has an 60% return rate across past orders.”</i>", script_style)
        ],
        [
            Paragraph("<b>Step 4: Escalation & Decision</b><br/>Ladder & Actions Panel", body_style),
            Paragraph("Select <b>Step 2 (Block COD)</b> on the 5-step ladder. Click <b>Reject Return</b>.<br/><i>Case status changes to 'Rejected'; COD privileges are locked in database.</i>", body_style),
            Paragraph("<i>“The merchant applies a progressive enforcement directive to block COD for this customer, and formally rejects the fraudulent return.”</i>", script_style)
        ],
        [
            Paragraph("<b>Final Decision: Audit Log</b><br/>Audit (`/merchant/audit-log`)", body_style),
            Paragraph("Open Audit Log. View new entry.<br/><i>Displays timestamped entry: 'Merchant rejected Case #102. Reason: Serial Mismatch. Directive: Block COD.'</i>", body_style),
            Paragraph("<i>“The action is immediately logged in the immutable audit trail with an exact timestamp, completing the dispute-proof workflow.”</i>", script_style)
        ]
    ]

    t_wf_m = Table(wf_merchant_data, colWidths=[1.8 * inch, 2.7 * inch, 2.8 * inch])
    t_wf_m.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_wf_m)
    story.append(Spacer(1, 10))

    # ==================== SECTION 6: FRAUD DETECTION LOGIC ====================
    add_section_header("6", "Fraud Detection / Return Guard Logic (Actual Implementation)")

    logic_p = Paragraph(
        "Return Guard evaluates return requests using a multi-factor weighted algorithm implemented in <b>fraud/services.py</b>. "
        "The system processes customer history, item telemetry, and physical verification to calculate a <b>Composite Risk Score (0 to 100)</b>.",
        body_style
    )
    story.append(logic_p)
    story.append(Spacer(1, 6))

    scoring_data = [
        [
            Paragraph("<b>Checkpoint Factor</b>", body_bold),
            Paragraph("<b>Weight</b>", body_bold),
            Paragraph("<b>Evaluation Method & Trigger Condition</b>", body_bold)
        ],
        [
            Paragraph("<b>1. Return Frequency & Abuse</b>", body_style),
            Paragraph("<b>25%</b>", body_bold),
            Paragraph("Ratio of returns to total orders in 90 days. Exceeding 40% triggers high penalty; &gt;60% triggers max penalty.", body_style)
        ],
        [
            Paragraph("<b>2. Serial Number Mismatch</b>", body_style),
            Paragraph("<b>25%</b>", body_bold),
            Paragraph("Compares dispatched hardware serial/IMEI against returned item photo OCR / customer claim. Mismatch adds +30 points.", body_style)
        ],
        [
            Paragraph("<b>3. Item Value at Risk</b>", body_style),
            Paragraph("<b>20%</b>", body_bold),
            Paragraph("Monetary value of returned SKU. High-value electronics (₹15,000+) receive scaled risk weighting due to resale fraud liability.", body_style)
        ],
        [
            Paragraph("<b>4. COD Refusal History</b>", body_style),
            Paragraph("<b>15%</b>", body_bold),
            Paragraph("Doorstep delivery rejections and non-acceptance rate. Repeated refusals signal non-serious buyers and shipping arbitrage.", body_style)
        ],
        [
            Paragraph("<b>5. Behavioral & Timing Signals</b>", body_style),
            Paragraph("<b>15%</b>", body_bold),
            Paragraph("Wardrobing indicators: return requested within &lt;12 hours of delivery on clothing, multi-variant bracketing, and device switching.", body_style)
        ]
    ]
    t_score = Table(scoring_data, colWidths=[2.2 * inch, 0.9 * inch, 4.2 * inch])
    t_score.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_score)
    story.append(Spacer(1, 6))

    # Tiers and 5-step ladder table
    tiers_data = [
        [
            Paragraph("<b>Risk Tier</b>", body_bold),
            Paragraph("<b>Score Range</b>", body_bold),
            Paragraph("<b>Automated System Action</b>", body_bold),
            Paragraph("<b>Merchant Action Available</b>", body_bold)
        ],
        [
            Paragraph("<font color='#059669'><b>LOW RISK</b></font>", body_style),
            Paragraph("0 – 29", body_style),
            Paragraph("Instant auto-approval; instant refund or return label generated.", body_style),
            Paragraph("Standard warehouse processing.", body_style)
        ],
        [
            Paragraph("<font color='#D97706'><b>MEDIUM RISK</b></font>", body_style),
            Paragraph("30 – 64", body_style),
            Paragraph("Mandatory Doorstep OTP verification; flagged for inspection.", body_style),
            Paragraph("Review proof photos, approve or hold.", body_style)
        ],
        [
            Paragraph("<font color='#E11D48'><b>HIGH RISK</b></font>", body_style),
            Paragraph("65 – 100", body_style),
            Paragraph("Refund withheld; routed to Priority Flagged Queue.", body_style),
            Paragraph("Inspect serial mismatch, apply 5-Step Escalation, Reject.", body_style)
        ]
    ]
    t_tiers = Table(tiers_data, colWidths=[1.4 * inch, 1.0 * inch, 2.5 * inch, 2.4 * inch])
    t_tiers.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_tiers)
    story.append(Spacer(1, 6))

    ladder_p = Paragraph(
        "<b>5-Step Progressive Escalation Ladder:</b><br/>"
        "• <b>Step 0 (Normal):</b> Full shopping & return privileges.<br/>"
        "• <b>Step 1 (Doorstep OTP Required):</b> Mandatory courier OTP verification for all handoffs.<br/>"
        "• <b>Step 2 (COD Suspended):</b> Cash on Delivery disabled; customer must pay prepaid.<br/>"
        "• <b>Step 3 (Prepaid Only + Manual Review):</b> All returns require pre-approval before pickup.<br/>"
        "• <b>Step 4 (Return Privileges Restricted):</b> 15% restocking fee applied; return window cut to 3 days.<br/>"
        "• <b>Step 5 (Permanent Account Restriction):</b> Account blocked from ordering and returns.",
        body_style
    )
    story.append(ladder_p)
    story.append(Spacer(1, 10))

    # ==================== SECTION 7: BEST DEMO SCENARIO ====================
    add_section_header("7", "Best Demo Scenario (Realistic Walkthrough Script)")

    scenario_p = Paragraph(
        "<b>Scenario:</b> A shopper purchases a premium smartphone (₹45,000) and attempts to return an older defective phone with a mismatched serial number.",
        body_bold
    )
    story.append(scenario_p)
    story.append(Spacer(1, 4))

    scenario_data = [
        [
            Paragraph("<b>Stage</b>", body_bold),
            Paragraph("<b>Screen / Tab to Show</b>", body_bold),
            Paragraph("<b>Live Action to Perform</b>", body_bold),
            Paragraph("<b>Presenter Spoken Line</b>", body_bold)
        ],
        [
            Paragraph("1. Order", body_style),
            Paragraph("Shopper Orders (`/orders`)", body_style),
            Paragraph("Locate delivered Smartphone order, click <b>Request Return</b>.", body_style),
            Paragraph("<i>“The customer receives a premium smartphone and initiates a return claim.”</i>", script_style)
        ],
        [
            Paragraph("2. Proof", body_style),
            Paragraph("Return Wizard (`/orders/:id/return`)", body_style),
            Paragraph("Enter reason, type wrong serial (S/N-1044), upload photo, click submit.", body_style),
            Paragraph("<i>“The customer uploads a photo with a different serial number. Return Guard flags it instantly.”</i>", script_style)
        ],
        [
            Paragraph("3. Scoring", body_style),
            Paragraph("Engine Processing (Instant)", body_style),
            Paragraph("Background engine scores 85/100 (High Risk) due to serial mismatch.", body_style),
            Paragraph("<i>“The system scores the claim at 85/100 and routes it to the merchant's priority queue.”</i>", script_style)
        ],
        [
            Paragraph("4. Queue", body_style),
            Paragraph("Flagged Cases (`/merchant/flagged-cases`)", body_style),
            Paragraph("Show Case #102 at top of queue with red <b>High Risk</b> badge.", body_style),
            Paragraph("<i>“The merchant immediately sees the flagged case in their priority queue.”</i>", script_style)
        ],
        [
            Paragraph("5. Audit", body_style),
            Paragraph("Case Room (`/merchant/flagged-cases/102`)", body_style),
            Paragraph("Highlight Serial Mismatch, select <b>Step 2 (Block COD)</b>, click <b>Reject</b>.", body_style),
            Paragraph("<i>“The merchant confirms the serial mismatch, restricts COD, and rejects the return.”</i>", script_style)
        ],
        [
            Paragraph("6. Result", body_style),
            Paragraph("Shopper Tracker (`/returns/:id/track`)", body_style),
            Paragraph("Refresh return tracker. Status updates to <b>Rejected</b> with reason.", body_style),
            Paragraph("<i>“The shopper's portal updates with the formal rejection and audit trail.”</i>", script_style)
        ]
    ]
    t_scen = Table(scenario_data, colWidths=[0.9 * inch, 1.8 * inch, 2.3 * inch, 2.3 * inch])
    t_scen.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_scen)
    story.append(Spacer(1, 10))

    # ==================== SECTION 8: IMPORTANT FEATURES TO HIGHLIGHT ====================
    add_section_header("8", "Important Features to Highlight (What Makes Return Guard Unique)")

    features = [
        (
            "1. Multi-Signal Composite Risk Engine",
            "Evaluates 5 distinct fraud checkpoints instead of one-dimensional rules, preventing arbitrary rejections.",
            "“Return Guard calculates a transparent 0-to-100 risk score combining return frequency, item value, serial telemetry, COD refusals, and behavior.”"
        ),
        (
            "2. Pre-Order Bracketing & Wardrobing Guard",
            "Intercepts abusive multi-size purchasing in the cart before orders are packed, saving return freight costs.",
            "“Our cart engine detects size-bracketing and wardrobing patterns at the browsing stage, nudging users with sizing advice before shipping occurs.”"
        ),
        (
            "3. Hardware Serial & Visual Proof Verification",
            "Eliminates item swapping and empty-box fraud by cross-matching manufacturer serials and customer photos.",
            "“Shoppers must submit photographic proof and confirm serial numbers, allowing merchants to verify hardware authenticity before issuing any refund.”"
        ),
        (
            "4. 5-Step Progressive Escalation Ladder",
            "Protects customer lifetime value by applying graduated consequences rather than blunt account bans.",
            "“Instead of unfair account bans, our progressive engine applies graduated restrictions, starting with mandatory OTPs before restricting payment methods.”"
        ),
        (
            "5. Courier Telemetry & Anomaly Gap Detection",
            "Pinpoints logistics fraud and courier theft by monitoring discrepancies between pickup and intake scans.",
            "“We analyze the time gap between doorstep courier pickups and warehouse intake scans, exposing internal courier theft before merchants incur losses.”"
        )
    ]

    for feat_name, why_matters, what_say in features:
        feat_content = [
            [Paragraph(f"<b>{feat_name}</b>", h2_style)],
            [Paragraph(f"<b>Why it matters:</b> {why_matters}", body_style)],
            [Paragraph(f"<b>One sentence to say:</b> <i>{what_say}</i>", script_style)]
        ]
        tf = Table(feat_content, colWidths=[7.15 * inch])
        tf.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), c_card_bg),
            ('BOX', (0, 0), (-1, -1), 0.6, c_card_border),
            ('LINELEFT', (0, 0), (-1, -1), 3, c_emerald),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(KeepTogether([tf, Spacer(1, 4)]))

    story.append(Spacer(1, 6))

    # ==================== SECTION 9: TECHNICAL EXPLANATION ====================
    add_section_header("9", "Technical Explanation — Simple Version (For Viva Panel)")

    tech_p = Paragraph(
        "<b>Architecture Pipeline:</b><br/>"
        "<b>React + Vite Frontend</b> &nbsp;──(JSON REST APIs)──>&nbsp; <b>Django REST Framework</b> &nbsp;──>&nbsp; <b>SQLite / PostgreSQL DB</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└──>&nbsp; <b>Rule-Based Scoring Engine & Progressive Enforcer</b>",
        body_style
    )
    story.append(tech_p)
    story.append(Spacer(1, 6))

    tech_points = [
        ("Frontend Layer", "Built using React 18, Vite, and Vanilla CSS with Lucide Icons. Provides responsive, decoupled client interfaces for Shoppers and Merchants."),
        ("Backend / API Layer", "Built using Python 3.12 and Django REST Framework (DRF). Manages authentication, token security, and business logic across 20+ REST API endpoints."),
        ("Database Layer", "Relational database schema storing normalized entities: Users, Products, Orders, Return Requests, Case Directives, and Courier Telemetry."),
        ("Fraud & Scoring Engine", "Modular Python service in <code>fraud/services.py</code> that computes composite weighted risk scores and enforces progressive restriction directives."),
        ("Real-time Courier Telemetry", "Cross-references doorstep OTP verification with warehouse scan intervals to monitor delivery agent performance and courier tampering.")
    ]
    for comp, desc in tech_points:
        p = Paragraph(f"• <b>{comp}:</b> {desc}", body_style)
        story.append(p)
        story.append(Spacer(1, 3))

    story.append(Spacer(1, 8))

    # ==================== SECTION 10: COMMON DEMO / VIVA QUESTIONS ====================
    add_section_header("10", "Common Demo & Viva Questions (15 Quick-Fire Answers)")

    viva_qa = [
        ("1. What is Return Guard?", "Return Guard is an intelligent e-commerce fraud prevention and return risk management platform that connects shoppers and merchants with automated risk scoring."),
        ("2. What specific problem does it solve?", "It stops return abuse—such as wardrobing, serial swapping, empty-box claims, and courier fraud—saving merchant revenues while keeping refunds fast for honest shoppers."),
        ("3. Who uses the system?", "Two primary users: Shoppers who browse products, place orders, and manage returns; and Merchants who audit flagged cases, configure risk weights, and monitor logistics."),
        ("4. How does the Shopper side work?", "Shoppers browse products, get pre-order sizing advice, order items, and initiate returns through a guided 4-step wizard with photographic and serial proof."),
        ("5. How does the Merchant side work?", "Merchants monitor financial KPIs on a dashboard, audit suspicious returns in a priority queue, inspect photo and serial evidence, and take progressive action."),
        ("6. How is fraud detected?", "Through a 5-checkpoint weighted scoring engine that evaluates return frequency, serial matching, item value, COD refusals, and behavioral timing signals."),
        ("7. How is the risk score calculated?", "Risk Score (0–100) = (Frequency × 25%) + (Serial Mismatch × 25%) + (Item Value × 20%) + (COD Refusal × 15%) + (Behavior × 15%)."),
        ("8. What do the risk levels mean?", "Low Risk (0–29) receives instant automated approval; Medium Risk (30–64) requires doorstep OTP or review; High Risk (65–100) holds refunds for merchant audit."),
        ("9. What happens after a high-risk return is detected?", "The refund is withheld, the case is routed to the Merchant Flagged Queue, and the customer is placed on a progressive escalation step."),
        ("10. What is the 5-step progressive escalation ladder?", "A graduated penalty system: Step 1 (Mandatory OTP) → Step 2 (COD Blocked) → Step 3 (Prepaid Only) → Step 4 (Restocking Fee) → Step 5 (Account Ban)."),
        ("11. What makes Return Guard different from standard systems?", "Traditional systems treat all returns equally. Return Guard uses multi-signal risk scoring, pre-order bracketing alerts, serial validation, and courier anomaly telemetry."),
        ("12. What technologies are used?", "React and Vite for the frontend UI; Python and Django REST Framework for backend APIs; SQLite/PostgreSQL for database storage; and a custom scoring engine."),
        ("13. How does the frontend communicate with the backend?", "The React client makes asynchronous HTTP REST API calls using JSON payloads, authenticated with session/token credentials."),
        ("14. How do you detect courier theft?", "Via Courier Telemetry, which measures the anomaly gap between doorstep pickup timestamps and warehouse intake scans to identify lost or swapped packages."),
        ("15. What are the limitations and future scope?", "Currently uses heuristic photo validation. Future work will integrate deep-learning CNNs for automatic visual defect segmentation and blockchain serial registries.")
    ]

    for q, a in viva_qa:
        qa_content = [
            [Paragraph(f"<b>Q: {q}</b>", body_bold)],
            [Paragraph(f"<b>Ans:</b> {a}", body_style)]
        ]
        t_qa = Table(qa_content, colWidths=[7.15 * inch])
        t_qa.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('LINELEFT', (0, 0), (-1, -1), 2.5, c_accent),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 2.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ]))
        story.append(KeepTogether([t_qa, Spacer(1, 3.5)]))

    story.append(Spacer(1, 6))

    # ==================== SECTION 11: DEMO PRESENTATION ORDER ====================
    add_section_header("11", "Demo Presentation Order (Presenter's Quick Cheatsheet)")

    order_p = Paragraph(
        "<b>Keep this sequence open on your desk/screen during the live demonstration:</b><br/><br/>"
        "<b>Phase 1: Opening (1 Minute)</b><br/>"
        "1. Speak the 30-second introduction pitch explaining e-commerce return fraud.<br/>"
        "2. State the two interconnected user roles: Shopper and Merchant.<br/><br/>"
        "<b>Phase 2: Shopper Demo (2–3 Minutes)</b><br/>"
        "3. Open <b>Shop (`/shop`)</b> — show AI Size Advisor and product return windows.<br/>"
        "4. Open <b>Cart (`/cart`)</b> — explain the Pre-Order Bracketing Alert.<br/>"
        "5. Open <b>My Orders (`/orders`)</b> — click <b>Request Return</b> on a delivered order.<br/>"
        "6. Complete <b>Return Wizard (`/orders/:id/return`)</b> — enter reason, mismatched serial, and upload photo proof.<br/>"
        "7. Show <b>Return Tracker (`/returns/:id/track`)</b> — point out the 5-milestone bar and Doorstep Pickup OTP.<br/><br/>"
        "<b>Phase 3: Merchant Demo (3–4 Minutes)</b><br/>"
        "8. Open <b>Merchant Dashboard (`/merchant`)</b> — highlight Loss Prevention ROI and Risk Tiers.<br/>"
        "9. Open <b>Flagged Cases (`/merchant/flagged-cases`)</b> — show the priority review queue and risk score (85/100).<br/>"
        "10. Enter <b>Case Detail Room (`/merchant/flagged-cases/:id`)</b> — show serial mismatch and photo evidence.<br/>"
        "11. Demonstrate <b>5-Step Escalation Ladder</b> — select Step 2 (Block COD) and click <b>Reject Return</b>.<br/>"
        "12. Show <b>Courier Telemetry (`/merchant/delivery-agents`)</b> — explain courier anomaly gap tracking.<br/>"
        "13. Show <b>Fraud Engine Config (`/merchant/fraud-config`)</b> — demonstrate interactive weight sliders.<br/>"
        "14. Show <b>Audit Log (`/merchant/audit-log`)</b> — verify the immutable timestamped decision record.<br/><br/>"
        "<b>Phase 4: Viva & Conclusion (1 Minute)</b><br/>"
        "15. Conclude: Return Guard protects merchant profits while rewarding honest shoppers with instant refunds.<br/>"
        "16. Invite questions from the viva panel.",
        body_style
    )
    order_box = Table([[order_p]], colWidths=[7.3 * inch])
    order_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F0FDF4")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#BBF7D0")),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(order_box)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {filename}")

if __name__ == "__main__":
    out_name = sys.argv[1] if len(sys.argv) > 1 else "demo ppt.pdf"
    build_pdf(out_name)
