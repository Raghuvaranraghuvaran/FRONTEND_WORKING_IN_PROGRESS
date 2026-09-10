import os
import time
from playwright.sync_api import sync_playwright

def capture_feature_screenshot():
    output_dir = os.path.abspath("screenshots")
    os.makedirs(output_dir, exist_ok=True)
    target_path = os.path.join(output_dir, "5_flagged_case_detail_28checkpoints.png")

    with sync_playwright() as p:
        # High DPI viewport for ultra-crisp slide graphics
        browser = p.chromium.launch(channel="msedge", headless=True)
        context = browser.new_context(
            viewport={"width": 1400, "height": 920},
            device_scale_factor=2
        )
        page = context.new_page()

        # Login
        print("Logging in...")
        page.goto("http://localhost:5173/merchant/login", wait_until="networkidle")
        time.sleep(1)
        page.fill("input[type='text'], input[placeholder*='username' i]", "ARIAFASHION4827")
        page.fill("input[type='password']", "demo123")
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        # Go to flagged case detail
        print("Navigating to flagged case...")
        page.goto("http://localhost:5173/merchant/flagged-cases/4", wait_until="networkidle")
        page.wait_for_timeout(2000)

        # Execute layout adjustment in browser DOM to bring:
        # 1. Customer Details & Case Header
        # 2. 5-Step Engine (Return Timeline)
        # 3. Decision Action Panel (Approve / Reject buttons)
        # all together in the visible viewport!
        page.evaluate("""() => {
            // Find timeline and decision panel
            const allHeadings = Array.from(document.querySelectorAll('h3'));
            const timelineH3 = allHeadings.find(h => h.textContent.includes('Return Timeline'));
            const decisionH3 = allHeadings.find(h => h.textContent.includes('Merchant Decision'));
            
            if (timelineH3 && decisionH3) {
                const timelineCard = timelineH3.closest('.rounded-2xl');
                const decisionCard = decisionH3.closest('.rounded-2xl');
                
                // Find Customer Details card
                const customerSpan = Array.from(document.querySelectorAll('span')).find(s => s.textContent.includes('Customer Details'));
                const customerCard = customerSpan ? customerSpan.closest('.rounded-2xl') : null;
                
                if (customerCard && timelineCard && decisionCard) {
                    // Reorder so that Customer Card is first, Timeline is second, Decision Card is third!
                    const parent = timelineCard.parentElement;
                    
                    // Place Customer Card right before Timeline
                    parent.insertBefore(customerCard, timelineCard);
                    // Place Decision Card right after Timeline
                    if (timelineCard.nextSibling) {
                        parent.insertBefore(decisionCard, timelineCard.nextSibling);
                    } else {
                        parent.appendChild(decisionCard);
                    }
                }
            }
        }""")

        page.wait_for_timeout(1000)

        # Capture screenshot
        page.screenshot(path=target_path, full_page=False)
        print(f"Captured perfectly aligned feature screenshot to: {target_path}")

        # Also save a copy with a distinct name for inspection
        preview_path = os.path.join(output_dir, "key_feature_user_timeline_decision.png")
        page.screenshot(path=preview_path, full_page=False)
        print(f"Saved preview to: {preview_path}")

        browser.close()

if __name__ == "__main__":
    capture_feature_screenshot()
