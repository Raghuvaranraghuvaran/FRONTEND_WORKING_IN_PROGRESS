import os
import time
from playwright.sync_api import sync_playwright

def capture():
    output_dir = os.path.abspath("screenshots")
    os.makedirs(output_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900}, device_scale_factor=2)
        page = context.new_page()

        # 1. Capture real landing page
        page.goto("http://localhost:5173/", wait_until="networkidle")
        time.sleep(1)
        landing_path = os.path.join(output_dir, "real_landing_page.png")
        page.screenshot(path=landing_path, full_page=False)
        print("Captured landing page:", landing_path)

        # 2. Login as Merchant
        print("Logging in as merchant...")
        page.goto("http://localhost:5173/merchant/login", wait_until="networkidle")
        time.sleep(1)
        
        # DEMO_CREDENTIALS.md specifies: demo@merchant.com / demo123
        page.fill("input[type='email'], input[type='text']", "demo@merchant.com")
        page.fill("input[type='password']", "demo123")
        page.click("button[type='submit']")
        page.wait_for_timeout(2500)
        print("URL after login:", page.url)

        # Ensure we are on /merchant dashboard
        if "/merchant" not in page.url:
            page.goto("http://localhost:5173/merchant", wait_until="networkidle")
            page.wait_for_timeout(2000)

        merchant_path = os.path.join(output_dir, "real_merchant_dashboard.png")
        page.screenshot(path=merchant_path, full_page=False)
        print("Captured real merchant dashboard:", merchant_path)

        # Overwrite 3_merchant_dashboard.png with the REAL merchant dashboard!
        dest_path = os.path.join(output_dir, "3_merchant_dashboard.png")
        page.screenshot(path=dest_path, full_page=False)
        print("Overwrote 3_merchant_dashboard.png with REAL merchant dashboard!")

        browser.close()

if __name__ == "__main__":
    capture()
