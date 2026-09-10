import time
from playwright.sync_api import sync_playwright

def test_merchant_tabs():
    errors = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()

        # Listen for console errors & dialogs
        page.on("console", lambda msg: errors.append(f"[CONSOLE {msg.type}] {msg.text}") if msg.type in ["error", "warning"] and "fetch" in msg.text.lower() else None)
        page.on("pageerror", lambda err: errors.append(f"[PAGE ERROR] {err}"))

        print("1. Logging into merchant...")
        page.goto("http://localhost:5173/merchant/login", wait_until="networkidle")
        page.fill("input[type='email'], input[type='text']", "demo@merchant.com")
        page.fill("input[type='password']", "demo123")
        page.click("button[type='submit']")
        page.wait_for_timeout(2000)
        print("Logged in, URL:", page.url)

        # List of all merchant tabs to visit
        tabs = [
            "/merchant",
            "/merchant/products",
            "/merchant/orders",
            "/merchant/customers",
            "/merchant/flagged-cases",
            "/merchant/flagged-cases/4",
            "/merchant/audit-log",
            "/merchant/analytics",
            "/merchant/onboarding",
            "/merchant/fraud-config",
            "/merchant/delivery-agents",
            "/merchant/coupons",
            "/merchant/settings",
        ]

        for tab in tabs:
            print(f"\nChecking tab: {tab}")
            page.goto(f"http://localhost:5173{tab}", wait_until="networkidle")
            page.wait_for_timeout(1000)
            
            # Check for error text in DOM
            content = page.content()
            for err_text in ["failed to fetch", "network error", "something went wrong", "error loading"]:
                if err_text in content.lower():
                    print(f"!!! FOUND ERROR TEXT '{err_text}' on {tab}!")
                    errors.append(f"DOM error on {tab}: {err_text}")

            # Find buttons on this tab and test clicking non-destructive ones
            buttons = page.query_selector_all("button:not([disabled])")
            print(f"Tab {tab} has {len(buttons)} buttons.")

        # Test specific actions on flagged case detail
        print("\nChecking flagged case detail buttons...")
        page.goto("http://localhost:5173/merchant/flagged-cases/4", wait_until="networkidle")
        page.wait_for_timeout(1500)
        
        # Check decision buttons
        approve_btn = page.query_selector("button:has-text('Approve Refund')")
        print("Approve button found:", bool(approve_btn))

        # Check fraud config buttons
        print("\nChecking fraud config tabs & buttons...")
        page.goto("http://localhost:5173/merchant/fraud-config", wait_until="networkidle")
        page.wait_for_timeout(1500)
        save_btn = page.query_selector("button:has-text('Save'), button:has-text('Update')")
        print("Save button on fraud config found:", bool(save_btn))

        browser.close()

    print("\n--- SUMMARY OF DETECTED ERRORS ---")
    for e in errors:
        print(e)
    if not errors:
        print("No console/DOM fetch errors detected in initial navigation scan.")

if __name__ == "__main__":
    test_merchant_tabs()
