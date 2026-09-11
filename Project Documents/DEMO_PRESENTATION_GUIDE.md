# DEMO PRESENTATION GUIDE
## RETURN GUARD — Intelligent Fraud Prevention System

> **Document Type:** College Project Demo & Viva Presentation Preparation Guide  
> **System Name:** Return Guard (RG)  
> **Focus:** Live Demonstration Script, Exact Tab Guide, Technical Architecture & Viva Q&A

---

## 1. DEMO INTRODUCTION

### Spoken Introduction (30–45 Seconds)
> *"Good morning, respected evaluators. Today, we present **Return Guard**, an intelligent fraud prevention and risk management platform designed for modern e-commerce.*
>
> *E-commerce merchants lose billions every year due to return abuse—such as wardrobing, empty box claims, fake product swaps, and serial number tampering. Traditional platforms treat every return equally, leading to heavy losses or frustrating honest shoppers.*
>
> *Return Guard bridges the **Shopper** and **Merchant** sides through a unified, real-time risk assessment engine. When a shopper places an order or initiates a return, our system evaluates return frequency, item value, serial matching, and doorstep delivery telemetry to generate an instant Risk Score. High-risk returns are automatically flagged for merchant review with progressive enforcement, while genuine customers enjoy instant, frictionless approvals.*
>
> *Let us now walk you through the live application, starting with the Shopper experience."*

---

## 2. SHOPPER SIDE — LIVE DEMO GUIDE

### 1. Home / Landing Page
* **What this tab does:**  
  The landing page introduces Return Guard’s value proposition, key security features, and provides quick navigation to both the Shopper store and the Merchant operations portal.
* **What to demonstrate:**  
  Show the clean hero banner, feature highlights (Instant Refunds, AI Fraud Shield, Doorstep Verification), and click on **"Shop Now"** or log in as a registered shopper.
* **What to say:**  
  *“This is our Landing Page. It introduces customers and merchants to Return Guard’s trusted shopping ecosystem. From here, users can seamlessly enter the consumer storefront or switch directly to merchant operations.”*

---

### 2. Shop / Catalog (`/shop`)
* **What this tab does:**  
  Displays available products with category filters, dynamic search, price sorting, and built-in AI sizing and comparison tools.
* **What to demonstrate:**  
  Filter products by category (Electronics, Fashion, Audio), show product cards with prices, return eligibility badges, and click **"AI Size Advisor"** or **"Compare"**.
* **What to say:**  
  *“This is the Product Catalog where shoppers browse items. Notice that each item clearly displays its return eligibility window. We also provide an AI Size Advisor to prevent wardrobing and size bracket abuse right at the browsing stage.”*

---

### 3. Product Details (`/products/:productId`)
* **What this tab does:**  
  Provides detailed product specifications, warranty information, serial tracking notice, and the 'Add to Cart' action.
* **What to demonstrate:**  
  Open a high-value item (like a Smartphone or Headphones), point out the serial verification badge, select quantity, and click **"Add to Cart"**.
* **What to say:**  
  *“On the Product Details page, customers can see full specifications and return conditions. For electronics, Return Guard informs the customer that serial verification applies upon delivery and return, establishing transparency from the start.”*

---

### 4. Cart & Pre-Order Guard (`/cart`)
* **What this tab does:**  
  Manages cart items, applies promo coupons, and actively checks for multi-variant bracketing (buying multiple sizes/colors of the same item with intent to return most).
* **What to demonstrate:**  
  Show the cart summary, coupon input field, and point out the **Bracketing Guard** warning badge if multiple sizes of an item are added.
* **What to say:**  
  *“In the Cart, shoppers can review their selected items. Return Guard’s pre-order engine monitors for bracketing behavior—like adding sizes M, L, and XL of the same shirt. If detected, an advisory prompt encourages the shopper to use our size guide, preventing avoidable returns.”*

---

### 5. Checkout (`/checkout`)
* **What this tab does:**  
  Collects shipping details, verifies the shipping address, and provides payment method selection between Prepaid (Cards/UPI) and Cash on Delivery (COD).
* **What to demonstrate:**  
  Fill in the demo shipping address, toggle between Payment Methods, and highlight how Return Guard enforces COD eligibility based on customer risk tier.
* **What to say:**  
  *“This is the Checkout page. Shoppers enter their delivery address and select payment. Notice that if an account has a history of high doorstep refusals, Return Guard can dynamically restrict COD to protect the merchant from shipping losses.”*

---

### 6. Shopper Dashboard (`/dashboard`)
* **What this tab does:**  
  Gives shoppers a personalized overview of active orders, return quota status, reward points, and their verified Trust Tier.
* **What to demonstrate:**  
  Point out the **Trust Score badge**, available return quota balance, loyalty reward points, and quick action cards for recent purchases.
* **What to say:**  
  *“Here is the Shopper Dashboard. It rewards honest customers with a high Trust Tier and loyalty points. Shoppers can clearly track their return quota and monitor all ongoing purchase activities in one transparent place.”*

---

### 7. My Orders (`/orders`)
* **What this tab does:**  
  Lists all past and present orders with delivery tracking progress bars, order cancellation with OTP, and direct links to initiate return requests.
* **What to demonstrate:**  
  Show orders categorized by status (Delivered, In Transit, Returned). Click on a delivered order to reveal the **"Request Return"** action button.
* **What to say:**  
  *“The My Orders page displays the shopper’s complete order history. For delivered items within the policy window, customers can initiate a return with a single click, launching our guided 4-step Return Wizard.”*

---

### 8. Guided Return Request Wizard (`/orders/:orderId/return`)
* **What this tab does:**  
  A structured 4-step wizard that captures return reasons, hardware serial numbers, mandatory visual photo proof, and refund/exchange preferences.
* **What to demonstrate:**  
  Walk through: Step 1 (Reason: Defective/Wrong item), Step 2 (Serial verification & item condition), Step 3 (Upload photo proof of front/back and box), Step 4 (Select Store Credit or Original Payment). Click **"Submit Return"**.
* **What to say:**  
  *“This is the 4-step Return Wizard. Instead of a simple text box, we require specific return reasons, serial confirmation, and photo proof. This ensures clear digital evidence before any return authorization is issued.”*

---

### 9. Return Live Tracking (`/returns/:returnId/track`)
* **What this tab does:**  
  Displays the live tracking timeline for an authorized return across 5 stages, including courier assignment, pickup schedule, and Doorstep Verification OTP.
* **What to demonstrate:**  
  Show the active milestone progress bar (Requested → Approved → Pickup Scheduled → In Transit → Inspected & Refunded) and point out the secure OTP code for courier handoff.
* **What to say:**  
  *“Once a return is initiated, the shopper tracks it live here. Return Guard issues a Doorstep Verification OTP that the customer must provide to the courier at pickup, preventing courier tampering or false pickup claims.”*

---

### 10. Wishlist (`/wishlist`)
* **What this tab does:**  
  Allows shoppers to save products for later with price-drop alerts and stock notifications.
* **What to demonstrate:**  
  Show saved items and how easily items can be moved directly to the cart.
* **What to say:**  
  *“The Wishlist allows customers to curate items they intend to buy. It keeps shoppers engaged without adding unnecessary impulse orders that often lead to returns.”*

---

### 11. Notifications Hub (`/notifications`)
* **What this tab does:**  
  Delivers instant alerts regarding order status, return approvals, risk flags, and refund disbursements.
* **What to demonstrate:**  
  Click the notification bell icon to display real-time updates and status changes.
* **What to say:**  
  *“The Notifications Hub keeps shoppers updated in real time. Whenever a merchant approves a return or releases a refund, the customer receives an immediate confirmation message.”*

---

### 12. Shopper Profile (`/profile`)
* **What this tab does:**  
  Displays personal details, saved shipping addresses, account security settings, and current Return Guard Trust Level.
* **What to demonstrate:**  
  Show the user's account details, trust badge (e.g., Verified Low Risk), and security options.
* **What to say:**  
  *“The Profile page summarizes account credentials and verified standing. High trust ratings unlock instant refunds, whereas accounts with repeated policy violations will see their restricted status here.”*

---

## 3. SHOPPER WORKFLOW (End-to-End Demo Flow)

```
Step 1: Browse Shop  ──>  Step 2: Review Cart  ──>  Step 3: Complete Checkout
                              │
Step 6: Track Return <──  Step 5: Return Wizard <──  Step 4: View Orders
```

* **Step 1: Browse & Select Product**
  * **What to click:** Go to **Shop (`/shop`)**, select a product (e.g., Sony WH-1000XM5 Headphones), and click **"Add to Cart"**.
  * **What happens:** Item is placed in cart with verified return eligibility.
  * **What to say:** *“First, the shopper selects a product from the catalog. The system verifies that the product is eligible for return and records its category.”*

* **Step 2: Cart & Bracketing Validation**
  * **What to click:** Click on the **Cart icon** to open `/cart`.
  * **What happens:** Cart displays subtotal; Return Guard validates item variants for bracketing patterns.
  * **What to say:** *“In the cart, Return Guard verifies item combinations. If no abusive purchasing pattern is detected, the shopper proceeds cleanly.”*

* **Step 3: Secure Checkout**
  * **What to click:** Click **"Proceed to Checkout"**, select shipping address, choose payment (Card/Prepaid), and click **"Place Order"**.
  * **What happens:** Order is created in the database and assigned a unique Order ID.
  * **What to say:** *“The shopper completes checkout. The order is stored in the database with timestamps and shipping coordinates.”*

* **Step 4: Access Delivered Order**
  * **What to click:** Navigate to **My Orders (`/orders`)**, locate the delivered order, and click **"Request Return"**.
  * **What happens:** The system opens the 4-step Return Wizard.
  * **What to say:** *“When the item is delivered, the customer has the option to request a return if there is an issue.”*

* **Step 5: Complete Return Wizard with Proof**
  * **What to click:** Select reason (*"Damaged or Defective"*), confirm the serial number, upload photographic proof, and click **"Submit Return"**.
  * **What happens:** The Return Guard Fraud Engine evaluates the submission, generates a Risk Score, and either auto-approves or routes it to the Merchant Flagged Queue.
  * **What to say:** *“The customer completes the return wizard with photo proof and serial confirmation. Return Guard instantly evaluates the return signals in the background.”*

* **Step 6: Live Return & OTP Tracking**
  * **What to click:** View the generated return in **Return Tracker (`/returns/:returnId/track`)**.
  * **What happens:** A 5-stage tracking bar is displayed along with a secure pickup OTP.
  * **What to say:** *“The shopper now has full visibility of the return lifecycle and a pickup OTP for courier verification.”*

---

## 4. MERCHANT SIDE — LIVE DEMO GUIDE

### 1. Merchant Dashboard (`/merchant`)
* **What this tab does:**  
  Serves as command central for merchant operations, displaying key performance indicators: Total Loss Prevented (₹), Pending Return Reviews, Risk Tier breakdown, and recent flagged incidents.
* **What to demonstrate:**  
  Point to the top metric cards (Loss Prevented ROI, Pending Audits), the Risk Tier chart (Low, Medium, High risk cases), and quick links to urgent flagged cases.
* **What to say:**  
  *“This is the Merchant Dashboard. It gives store owners instant visibility into their return health and fraud savings. Notice the Risk Tier distribution and the queue of pending return audits requiring merchant attention.”*

---

### 2. Flagged Cases & Return Audits (`/merchant/flagged-cases`)
* **What this tab does:**  
  Displays the prioritized queue of suspicious or high-risk returns flagged by Return Guard's scoring engine.
* **What to demonstrate:**  
  Show the list of cases with Risk Scores (e.g., 85/100, 72/100), risk badges, customer names, and filter by Risk Tier (High / Medium / Low). Click on any high-risk case to open its detail view.
* **What to say:**  
  *“This is the Flagged Cases queue—the heart of Return Guard's merchant operations. Every return that exceeds the merchant’s risk threshold is automatically caught here with its calculated risk score, eliminating manual guesswork.”*

---

### 3. Flagged Case Detail & Resolution Room (`/merchant/flagged-cases/:caseId`)
* **What this tab does:**  
  Provides deep forensic analysis for a single return: customer return history, photo proof inspection, hardware serial verification, 5-step progressive escalation controls, and decision buttons (Approve, Reject, Hold).
* **What to demonstrate:**  
  Show the uploaded photo proof, serial matching status, the **5-Step Progressive Escalation Ladder**, action directives (Force OTP, Block COD, Suspend Account), and click **"Approve"** or **"Reject Return"**.
* **What to say:**  
  *“Here in the Case Resolution Room, the merchant examines forensic evidence: uploaded photos, serial matching, and past frequency. The merchant can issue progressive directives—like enforcing OTP or blocking COD—or make an immediate Approve/Reject decision.”*

---

### 4. Orders Management (`/merchant/orders`)
* **What this tab does:**  
  Manages all store orders across fulfillment statuses, allows merchants to mark deliveries, and records doorstep refusals.
* **What to demonstrate:**  
  Show the orders table, click **"Record Doorstep Refusal"** on a COD order, or update fulfillment status to Delivered.
* **What to say:**  
  *“The Orders Management tab tracks all customer purchases. Merchants can log doorstep delivery refusals here, which feeds directly into Return Guard's algorithm to catch chronic COD abuse.”*

---

### 5. Products Catalog (`/merchant/products`)
* **What this tab does:**  
  Manages store inventory, enables bulk CSV product imports, and highlights products with abnormal return rates.
* **What to demonstrate:**  
  Show product listings with stock counts, the **"Bulk Import CSV"** button, and return-rate badges on individual items.
* **What to say:**  
  *“In Products Catalog, merchants manage inventory and catalog settings. Return Guard flags items that suffer abnormally high return rates, alerting merchants to potential supplier defects or sizing mismatches.”*

---

### 6. Customers Directory & Risk Profiles (`/merchant/customers`)
* **What this tab does:**  
  Lists all registered shoppers with their cumulative spend, return rate percentage, cross-merchant trust rating, and violation flags.
* **What to demonstrate:**  
  Search for a customer, show their calculated Return Ratio, Risk Badge (Trusted vs High Risk), and total returns count.
* **What to say:**  
  *“The Customers Directory provides a holistic risk profile for every buyer. Merchants can identify habitual return abusers and see whether a customer has cross-store return violations across the network.”*

---

### 7. Delivery Agents & Courier Telemetry (`/merchant/delivery-agents`)
* **What this tab does:**  
  Monitors courier performance, tracks courier anomaly gaps (returns marked picked up vs transit scans), and enables courier fraud investigations.
* **What to demonstrate:**  
  Show courier partner cards (BlueDart, Delhivery, Shadowfax), anomaly gap indicators, and the **"Sign-Off Investigation"** action.
* **What to say:**  
  *“Return Guard doesn't just evaluate shoppers—it tracks courier telemetry. This tab highlights discrepancies between doorstep pickups and warehouse intake scans, exposing internal courier theft or missing return packages.”*

---

### 8. Coupons & Discounts (`/merchant/coupons`)
* **What this tab does:**  
  Configures promotional codes, usage limits, and minimum order values to prevent discount abuse and refund gaming.
* **What to demonstrate:**  
  Show active coupons, usage statistics, and the modal to create a new coupon with fraud prevention restrictions.
* **What to say:**  
  *“Here the merchant manages promotional discount codes. Return Guard ensures that refunded orders properly reconcile promotional discounts so abusers cannot exploit coupon loopholes.”*

---

### 9. Fraud Engine Configuration & VIP Lists (`/merchant/fraud-config`)
* **What this tab does:**  
  Allows merchants to customize Return Guard's scoring engine: adjust weights for the 5 risk signals, modify tier thresholds, and manage VIP Whitelists / Blacklists.
* **What to demonstrate:**  
  Adjust the **Weight Sliders** (Frequency, High Value, Serial Mismatch, COD Refusal, Behavioral), modify the Low/Medium/High thresholds, and show the VIP customer lists.
* **What to say:**  
  *“In Fraud Configuration, merchants have total control over the scoring engine. They can tune weights for high-value goods or serial verification, set risk thresholds, and whitelist loyal VIPs from automated blocks.”*

---

### 10. Analytics & Self-Tuning ML (`/merchant/analytics`)
* **What this tab does:**  
  Presents financial analytics, monthly return volume charts, category-wise risk breakdown, and AI self-tuning recommendation cards.
* **What to demonstrate:**  
  Point out the Return Trend chart, Category Loss breakdown, and the **"Self-Tuning Suggestions"** panel.
* **What to say:**  
  *“The Analytics tab visualizes long-term trends and fraud patterns. Our self-tuning engine analyzes historical outcomes and recommends optimal threshold adjustments to minimize both fraud and false positives.”*

---

### 11. Audit Log (`/merchant/audit-log`)
* **What this tab does:**  
  Maintains an immutable, timestamped record of every merchant decision, override, rule change, and risk escalation.
* **What to demonstrate:**  
  Show the chronological feed with actor names, action types (e.g., "Case #102 Rejected", "COD Block Applied"), timestamps, and IP/source tags.
* **What to say:**  
  *“This is the Immutable Audit Log. Every action taken by a merchant—whether approving a refund, blocking COD, or changing weights—is permanently recorded with timestamps for compliance and dispute resolution.”*

---

### 12. Store Settings & Onboarding (`/merchant/settings`)
* **What this tab does:**  
  Configures merchant business details, return policy grace periods, webhook URLs, and API keys.
* **What to demonstrate:**  
  Show store profile settings, return policy duration (e.g., 7 days, 15 days), and integration webhook status.
* **What to say:**  
  *“Finally, Store Settings allows merchants to customize store policies, grace periods, and API integrations with existing e-commerce storefronts like Shopify or WooCommerce.”*

---

## 5. MERCHANT WORKFLOW (End-to-End Demo Flow)

```
Step 1: Open Dashboard  ──>  Step 2: Flagged Cases Queue  ──>  Step 3: Inspect Case Room
                                                                    │
Step 5: Verify Audit Log <──  Step 4: Progressive Action & Decision ┘
```

* **Step 1: Review Dashboard Overview**
  * **What to click:** Navigate to **Merchant Dashboard (`/merchant`)**.
  * **What information appears:** Total loss prevented (₹), count of pending review cases, risk tier chart.
  * **What happens next:** Click on **"Review Flagged Cases"** button.
  * **What to say:** *“The merchant begins their shift on the dashboard, noting 3 pending high-risk returns requiring audit.”*

* **Step 2: Access Priority Flagged Queue**
  * **What to click:** Open **Flagged Cases (`/merchant/flagged-cases`)** and click on Case `#102` (Risk Score: 85).
  * **What information appears:** Customer name, item value, return reason, and highlighted risk factor badges.
  * **What happens next:** Opens the dedicated Case Resolution Room.
  * **What to say:** *“The merchant opens the priority queue and selects the highest-risk case—a high-value smartphone return with a risk score of 85.”*

* **Step 3: Inspect Photographic Proof & Serial Telemetry**
  * **What to click:** Inside `/merchant/flagged-cases/102`, scroll to the **Forensic Evidence** and **Serial Verification** panels.
  * **What information appears:** Customer's uploaded photos, original dispatched serial number vs claimed serial number, and customer's 60% historical return rate.
  * **What happens next:** Discrepancy is clearly visible (serial numbers do not match).
  * **What to say:** *“The merchant inspects the evidence: the customer returned a photo with a mismatched serial number, and their account has an 60% return rate across past orders.”*

* **Step 4: Apply Progressive Escalation & Decision**
  * **What to click:** Select **Step 2 (Block COD)** on the escalation ladder, and click **"Reject Return"** with notes: *"Serial number mismatch"*.
  * **What information appears:** The return status changes to **Rejected**, customer is notified, and COD privileges are restricted for future orders.
  * **What to say:** *“The merchant applies a progressive enforcement directive to block COD for this customer, and formally rejects the fraudulent return.”*

* **Step 5: Verify Immutable Audit Log**
  * **What to click:** Navigate to **Audit Log (`/merchant/audit-log`)**.
  * **What information appears:** A new entry: *"Admin rejected Return #102 - Reason: Serial number mismatch - Directive: Block COD applied"*.
  * **What to say:** *“The action is immediately logged in the immutable audit trail with an exact timestamp, completing the dispute-proof workflow.”*

---

## 6. FRAUD DETECTION / RETURN GUARD LOGIC

```
[Customer / Return Data] 
       │
       ▼
[5 Checkpoint Risk Engine]
  ├── 1. Return Frequency & Historical Abuse (Weight: 25%)
  ├── 2. High-Value / Item Price at Risk     (Weight: 20%)
  ├── 3. Serial Number / Hardware Mismatch   (Weight: 25%)
  ├── 4. Cash on Delivery (COD) Refusal Rate (Weight: 15%)
  └── 5. Behavioral & Timing Signals         (Weight: 15%)
       │
       ▼
[Composite Risk Score: 0 to 100]
       │
       ├── Low Risk (0 – 29)     ──> Auto-Approved, Instant Refund / Return Tag
       ├── Medium Risk (30 – 64) ──> Doorstep OTP Verification, Manual Review
       └── High Risk (65 – 100)  ──> Flagged Queue, Hold Refund, Progressive Penalty
       │
       ▼
[5-Step Progressive Escalation Ladder]
  Step 0: Normal Standing
  Step 1: Mandatory Doorstep OTP
  Step 2: Cash on Delivery Suspended
  Step 3: Prepaid Only + Manual Return Approval
  Step 4: Return Privileges Restricted (Restocking Fee Applied)
  Step 5: Permanent Account Restriction
```

### Explanation of Rules and Weights
1. **Return Frequency (25%):** Analyzes the ratio of returned items to total orders over the past 90 days. Customers with over 40% return rates trigger significant score penalties.
2. **Serial / Hardware Mismatch (25%):** Compares the registered product serial/IMEI at dispatch against customer-submitted photos and return requests. A mismatch flags an instant high-risk alert.
3. **Item Value at Risk (20%):** Higher-priced products (e.g., luxury fashion, premium electronics) inherently carry greater fraud liability and receive scaled risk weighting.
4. **COD Refusal History (15%):** Tracks repeated doorstep courier rejections where delivery attempts failed due to non-acceptance, protecting merchants from double-freight shipping losses.
5. **Behavioral & Timing Signals (15%):** Detects rapid wardrobing (initiating returns within hours of weekend delivery), multi-variant bracketing, and device/IP switching.

---

## 7. BEST DEMO SCENARIO (Step-by-Step Live Script)

| Step | Exact Tab / Screen | Action to Perform | Presenter Spoken Line |
| :--- | :--- | :--- | :--- |
| **1** | Shopper Store (`/shop`) | Click Sony Headphones, add to cart | *"We start as a shopper browsing premium electronics and adding headphones to the cart."* |
| **2** | Shopper Cart (`/cart`) | Review cart & proceed | *"Return Guard checks for bracketing abuse. With a clean cart, we proceed to checkout."* |
| **3** | Shopper Orders (`/orders`) | Locate delivered order, click **Request Return** | *"Once delivered, the customer requests a return, launching our structured 4-step Return Wizard."* |
| **4** | Return Wizard (`/orders/:id/return`) | Select 'Damaged', input mismatched serial, upload photo | *"The customer submits a return with an altered serial number. Return Guard calculates risk in real time."* |
| **5** | Merchant Dashboard (`/merchant`) | Point out updated pending audits badge | *"Switching to the Merchant side, the system has automatically flagged this return as High Risk."* |
| **6** | Flagged Cases (`/merchant/flagged-cases`) | Open Case `#102` (Risk Score: 85) | *"In Flagged Cases, the merchant inspects the case with its calculated risk score of 85 out of 100."* |
| **7** | Case Detail (`/merchant/flagged-cases/:id`) | Show photo mismatch, click **Reject Return** & apply Step 2 Directive | *"The merchant verifies the serial mismatch, blocks COD privileges, and rejects the return."* |
| **8** | Return Tracker (`/returns/:id/track`) | Refresh shopper return tracker | *"On the Shopper side, the return status immediately updates to Rejected with an explanation."* |

---

## 8. IMPORTANT FEATURES TO HIGHLIGHT

* **1. Multi-Signal Composite Risk Engine**  
  * *Why it matters:* Evaluates 5 weighted checkpoints rather than relying on blunt, one-dimensional rules.  
  * *What to say:* *“Return Guard calculates a transparent 0-to-100 risk score combining return frequency, item value, serial telemetry, COD refusals, and behavior.”*

* **2. Pre-Order Bracketing & Wardrobing Guard**  
  * *Why it matters:* Catches abuse before items are shipped, minimizing reverse logistics overhead.  
  * *What to say:* *“Our cart engine detects size-bracketing and wardrobing patterns at the browsing stage, nudging users with sizing advice before shipping occurs.”*

* **3. Hardware Serial & Visual Proof Verification**  
  * *Why it matters:* Prevents item swapping and empty-box scams by validating digital serial numbers and photos.  
  * *What to say:* *“Shoppers must submit photographic proof and confirm serial numbers, allowing merchants to verify hardware authenticity before issuing any refund.”*

* **4. 5-Step Progressive Escalation Ladder**  
  * *Why it matters:* Avoids banning good customers instantly; enforces fair, graduated consequences (OTP → COD Block → Prepaid Only → Suspension).  
  * *What to say:* *“Instead of unfair account bans, our progressive engine applies graduated restrictions, starting with mandatory OTPs before restricting payment methods.”*

* **5. Courier Telemetry & Anomaly Gap Detection**  
  * *Why it matters:* Identifies package theft and fraud occurring within third-party logistics and delivery couriers.  
  * *What to say:* *“We analyze the time gap between doorstep courier pickups and warehouse intake scans, exposing internal courier theft before merchants incur losses.”*

---

## 9. TECHNICAL EXPLANATION — SIMPLE VERSION

> **Architecture Flow:**  
> **React + Vite Frontend  ──(REST APIs / JSON)──>  Django REST Framework  ──>  SQLite / PostgreSQL DB**  
> **&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└──>  Rule-Based Scoring Engine & Progressive Enforcer**

1. **Frontend Layer:** Built using **React** and **Vite** with modern modular CSS and Lucide icons, providing separate, responsive interfaces for Shoppers and Merchants.
2. **Backend / API Layer:** Built using **Python** and **Django REST Framework (DRF)**, handling secure RESTful API endpoints for authentication, order processing, and return management.
3. **Database Layer:** Structured relational database storing normalized models for Users, Products, Orders, Return Requests, Case Directives, and immutable Audit Logs.
4. **Scoring & Fraud Engine:** Modular Python risk engine in `fraud/services.py` that computes multi-factor weighted risk scores and enforces the 5-step progressive penalty matrix.
5. **Real-time Telemetry:** Connects doorstep courier pickup OTP verification with warehouse scan timelines to deliver end-to-end audit security.

---

## 10. COMMON DEMO & VIVA QUESTIONS

1. **What is Return Guard?**  
   *Answer:* Return Guard is an intelligent e-commerce fraud prevention and return risk management platform that bridges shoppers and merchants with automated risk scoring.

2. **What problem does it solve?**  
   *Answer:* It stops e-commerce return fraud—such as wardrobing, serial swapping, fake damage claims, and courier theft—saving merchants billions while keeping refunds fast for honest buyers.

3. **Who are the users of this system?**  
   *Answer:* Two primary users: **Shoppers** who browse products, place orders, and manage returns; and **Merchants** who audit flagged returns, adjust fraud rules, and track logistics.

4. **How does the system calculate the Risk Score?**  
   *Answer:* It calculates a weighted composite score (0–100) across 5 checkpoints: Return Frequency (25%), Serial Mismatch (25%), Item Value (20%), COD Refusals (15%), and Behavioral Signals (15%).

5. **What are the different risk levels?**  
   *Answer:* Low Risk (0–29) for instant approvals; Medium Risk (30–64) requiring OTP verification or manual review; and High Risk (65–100) routed to the merchant flagged queue.

6. **What happens after a high-risk return is detected?**  
   *Answer:* The return is withheld from instant refunding, routed to the Merchant Flagged Cases queue, and the customer is placed on the appropriate step of the progressive escalation ladder.

7. **What is the 5-Step Progressive Escalation Ladder?**  
   *Answer:* A fair enforcement system that graduates penalties: Step 1 (Mandatory OTP), Step 2 (COD Blocked), Step 3 (Prepaid Only), Step 4 (Restricted Returns), and Step 5 (Account Ban).

8. **What makes Return Guard different from standard e-commerce returns?**  
   *Answer:* Traditional systems treat all returns equally. Return Guard uses multi-signal risk scoring, pre-order bracketing detection, hardware serial validation, and courier anomaly telemetry.

9. **What technologies did you use to build this project?**  
   *Answer:* React and Vite for the frontend UI; Python and Django REST Framework for backend APIs; SQLite/PostgreSQL for relational data; and a custom weighted scoring engine.

10. **How does the frontend communicate with the backend?**  
    *Answer:* The React client communicates with Django via asynchronous HTTP REST API calls using JSON payloads, protected with token/session authentication.

11. **How is the data stored?**  
    *Answer:* Data is stored in a relational schema with tables for Products, Orders, Returns, Case Audits, Courier Telemetry, and Fraud Configurations.

12. **What are the limitations of the current system?**  
    *Answer:* Computer vision verification for uploaded photos currently uses heuristic image validation rather than deep-learning defect segmentation.

13. **What can be added in the future?**  
    *Answer:* Integration of deep-learning CNNs for automatic visual defect verification, blockchain-backed decentralized serial registries, and carrier API webhooks for real-time GPS tracking.

14. **How do you prevent courier theft?**  
    *Answer:* Through our Courier Telemetry module, which compares doorstep pickup timestamps with transit scan intervals to flag suspicious anomaly gaps.

15. **Can a merchant customize the fraud detection rules?**  
    *Answer:* Yes. Through the Fraud Configuration tab, merchants can adjust the weights of all 5 checkpoints and customize threshold ranges to fit their specific product catalog.

---

## 11. DEMO PRESENTATION ORDER (Presenter's Quick Cheatsheet)

### Phase 1: Opening (1 Minute)
* [ ] Introduce Return Guard & problem statement (30s spoken script).
* [ ] Mention the two interconnected portals: Shopper and Merchant.

### Phase 2: Shopper Demo (2–3 Minutes)
* [ ] Show **Shop (`/shop`)** & AI Size Advisor.
* [ ] Show **Cart (`/cart`)** & Bracketing Protection note.
* [ ] Show **My Orders (`/orders`)** & initiate a return.
* [ ] Complete the **4-Step Return Wizard (`/orders/:id/return`)** with photo & serial.
* [ ] Show **Return Tracker (`/returns/:id/track`)** with Doorstep Pickup OTP.

### Phase 3: Merchant Demo (3–4 Minutes)
* [ ] Open **Merchant Dashboard (`/merchant`)** — point to Loss Prevented ROI & Risk Tiers.
* [ ] Navigate to **Flagged Cases (`/merchant/flagged-cases`)** — select High-Risk Case.
* [ ] Open **Case Detail Room (`/merchant/flagged-cases/:id`)** — show serial mismatch & photo proof.
* [ ] Demonstrate **5-Step Escalation Ladder** — apply Step 2 (Block COD) and click **Reject Return**.
* [ ] Show **Courier Telemetry (`/merchant/delivery-agents`)** — explain courier anomaly gaps.
* [ ] Show **Fraud Engine Config (`/merchant/fraud-config`)** — demonstrate weight sliders.
* [ ] Show **Audit Log (`/merchant/audit-log`)** — show the immutable timestamped decision record.

### Phase 4: Viva & Conclusion (1 Minute)
* [ ] Summarize the core value: protects merchant revenue while rewarding honest shoppers.
* [ ] Invite questions from the panel.
