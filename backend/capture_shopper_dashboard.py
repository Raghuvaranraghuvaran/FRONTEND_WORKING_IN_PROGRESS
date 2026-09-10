import os
import time
from playwright.sync_api import sync_playwright

def capture_shopper():
    output_dir = os.path.abspath("screenshots")
    os.makedirs(output_dir, exist_ok=True)
    target_path = os.path.join(output_dir, "shopper_dashboard.png")

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        context = browser.new_context(
            viewport={"width": 1400, "height": 900},
            device_scale_factor=2
        )
        page = context.new_page()

        print("Navigating to Shopper Login...")
        page.goto("http://localhost:5173/login", wait_until="networkidle")
        time.sleep(1)

        # Login as shopper
        page.fill("input[type='email'], input[placeholder*='email' i]", "demo@shopper.com")
        page.fill("input[type='password']", "demo123")
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        # Go to Shopper Dashboard
        print("Navigating to Shopper Dashboard...")
        page.goto("http://localhost:5173/dashboard", wait_until="networkidle")
        page.wait_for_timeout(2000)

        page.screenshot(path=target_path, full_page=False)
        print(f"Captured Shopper Dashboard to: {target_path}")

        browser.close()

if __name__ == "__main__":
    capture_shopper()
