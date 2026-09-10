import os
import time
from playwright.sync_api import sync_playwright

def capture():
    output_dir = os.path.abspath("screenshots")
    os.makedirs(output_dir, exist_ok=True)
    print(f"Capturing screenshots to: {output_dir}")

    with sync_playwright() as p:
        # Launch using installed Edge
        browser = p.chromium.launch(channel="msedge", headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()

        # 1. Shopper Landing Page
        print("Navigating to Shopper Landing Page...")
        page.goto("http://localhost:5173/", wait_until="networkidle")
        time.sleep(1)
        path1 = os.path.join(output_dir, "1_shopper_home.png")
        page.screenshot(path=path1, full_page=False)
        print(f"Saved: {path1}")

        # 2. Shopper Catalog Page
        print("Navigating to Shopper Catalog...")
        page.goto("http://localhost:5173/shop", wait_until="networkidle")
        time.sleep(1)
        path2 = os.path.join(output_dir, "2_shopper_catalog.png")
        page.screenshot(path=path2, full_page=False)
        print(f"Saved: {path2}")

        # 3. Merchant Login
        print("Navigating to Merchant Login...")
        page.goto("http://localhost:5173/merchant/login", wait_until="networkidle")
        time.sleep(1)
        
        # Fill login form
        # Form has username and password
        try:
            page.fill("input[type='text'], input[placeholder*='username' i]", "ARIAFASHION4827")
            page.fill("input[type='password']", "demo123")
            # Submit form
            page.click("button[type='submit']")
            page.wait_for_load_state("networkidle")
            time.sleep(2)
        except Exception as e:
            print(f"Login click note: {e}")

        # 4. Merchant Dashboard
        print("Navigating to Merchant Dashboard...")
        page.goto("http://localhost:5173/merchant/dashboard", wait_until="networkidle")
        time.sleep(2)
        path3 = os.path.join(output_dir, "3_merchant_dashboard.png")
        page.screenshot(path=path3, full_page=False)
        print(f"Saved: {path3}")

        # 5. Flagged Cases Queue
        print("Navigating to Flagged Cases Queue...")
        page.goto("http://localhost:5173/merchant/flagged-cases", wait_until="networkidle")
        time.sleep(2)
        path4 = os.path.join(output_dir, "4_flagged_cases_queue.png")
        page.screenshot(path=path4, full_page=False)
        print(f"Saved: {path4}")

        # 6. Flagged Case Detail (ret-1 or first return)
        print("Navigating to Flagged Case Detail...")
        page.goto("http://localhost:5173/merchant/flagged-cases/ret-1", wait_until="networkidle")
        time.sleep(2)
        path5 = os.path.join(output_dir, "5_flagged_case_detail_28checkpoints.png")
        page.screenshot(path=path5, full_page=False)
        print(f"Saved: {path5}")

        # 7. Merchant Fraud Configuration
        print("Navigating to Fraud Configuration...")
        page.goto("http://localhost:5173/merchant/fraud-config", wait_until="networkidle")
        time.sleep(2)
        path6 = os.path.join(output_dir, "6_merchant_fraud_config.png")
        page.screenshot(path=path6, full_page=False)
        print(f"Saved: {path6}")

        # 8. Delivery Agents Collusion
        print("Navigating to Delivery Agents...")
        page.goto("http://localhost:5173/merchant/delivery-agents", wait_until="networkidle")
        time.sleep(2)
        path7 = os.path.join(output_dir, "7_delivery_agents_collusion.png")
        page.screenshot(path=path7, full_page=False)
        print(f"Saved: {path7}")

        browser.close()
        print("Screenshot capture complete!")

if __name__ == "__main__":
    capture()
