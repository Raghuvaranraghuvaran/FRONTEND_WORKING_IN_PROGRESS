import os
import time
from playwright.sync_api import sync_playwright

def inspect():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1050})
        page.goto("http://localhost:5173/merchant/login", wait_until="networkidle")
        time.sleep(1)
        page.fill("input[type='text'], input[placeholder*='username' i]", "ARIAFASHION4827")
        page.fill("input[type='password']", "demo123")
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)

        page.goto("http://localhost:5173/merchant/flagged-cases/4", wait_until="networkidle")
        page.wait_for_timeout(2000)

        user_el = page.locator("text=Customer Details").first
        timeline_el = page.locator("text=Return Timeline").first
        decision_el = page.locator("text=Merchant Decision").first
        approve_el = page.locator("button:has-text('Approve Refund')").first
        reject_el = page.locator("button:has-text('Reject')").first

        print("user_el box:", user_el.bounding_box() if user_el.count() else None)
        print("timeline_el box:", timeline_el.bounding_box() if timeline_el.count() else None)
        print("decision_el box:", decision_el.bounding_box() if decision_el.count() else None)
        print("approve_el box:", approve_el.bounding_box() if approve_el.count() else None)
        print("reject_el box:", reject_el.bounding_box() if reject_el.count() else None)

        browser.close()

if __name__ == "__main__":
    inspect()
