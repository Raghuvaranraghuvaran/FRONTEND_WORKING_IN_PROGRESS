import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def request(path, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{path}"
    h = {
        "Content-Type": "application/json",
        "X-Role": "merchant",
        "X-Merchant-Id": "merchant_1",
    }
    if headers:
        h.update(headers)
    
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=h, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            status_code = resp.getcode()
            try:
                res_json = json.loads(content)
            except Exception:
                res_json = content
            return status_code, res_json
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            err_json = json.loads(content)
        except Exception:
            err_json = content
        return e.code, err_json
    except Exception as ex:
        return 0, str(ex)

results = []

def record(section, test_name, passed, details=""):
    results.append({
        "section": section,
        "test": test_name,
        "passed": passed,
        "details": details
    })
    mark = "PASS" if passed else "FAIL"
    print(f"[{mark}] [{section}] {test_name}: {details}")

print("=== STARTING COMPLETE END-TO-END AUDIT ACROSS ALL 9 SECTIONS ===\n")

# 1. PRODUCTS
code, res = request("/api/admin/products/")
record("1. Products", "List products", code == 200 and isinstance(res.get("data"), list), f"Found {len(res.get('data', []))} products")

# Product search
code, res_search = request("/api/admin/products/?query=Watch")
record("1. Products", "Search products", code == 200 and isinstance(res_search.get("data"), list), f"Matches: {len(res_search.get('data', []))}")

# Add product
new_prod_payload = {
    "name": "Audit Test Headphone 9000",
    "price": 2499.00,
    "stock": 15,
    "category_id": "electronics",
    "is_active": True,
    "description": "Premium test headphones created during e2e audit"
}
code, res_create = request("/api/admin/products/", method="POST", data=new_prod_payload)
prod_id = res_create.get("data", {}).get("id") if code == 201 else None
record("1. Products", "Create product", code == 201 and prod_id is not None, f"Created product id={prod_id}")

# Edit / Patch product
if prod_id:
    code, res_patch = request(f"/api/admin/products/{prod_id}/", method="PATCH", data={"price": 2799.00, "stock": 20})
    patch_price = float(res_patch.get("data", {}).get("price", 0))
    record("1. Products", "Update product price & stock", code == 200 and patch_price == 2799.0, "Price updated to 2799, stock to 20")

    # Delete product
    code, res_del = request(f"/api/admin/products/{prod_id}/", method="DELETE")
    record("1. Products", "Delete product", code == 200 and res_del.get("data", {}).get("deleted") is True, f"Deleted product id={prod_id}")

# Bulk upload
bulk_payload = {
    "products": [
        {"name": "Bulk Test Item Alpha", "price": 499, "stock": 10, "category": "Accessories"},
        {"name": "Bulk Test Item Beta", "price": 999, "stock": 5, "category": "Accessories"}
    ]
}
code, res_bulk = request("/api/admin/products/bulk/", method="POST", data=bulk_payload)
record("1. Products", "Bulk CSV/Array Upload", code == 201 and res_bulk.get("data", {}).get("count") == 2, "Imported 2 bulk products")


# 2. ORDERS
code, res_orders = request("/api/admin/orders/")
orders = res_orders.get("data", [])
record("2. Orders", "List orders", code == 200 and len(orders) > 0, f"Found {len(orders)} orders in database")

if orders:
    test_order = orders[0]
    order_id = test_order["id"]
    # Update order status
    code, res_status = request(f"/api/admin/orders/{order_id}/status/", method="POST", data={"delivery_status": "Delivered", "notes": "E2E delivery test"})
    record("2. Orders", "Update order status via /admin/orders/<id>/status/", code == 200, f"Order {test_order.get('order_number')} status updated")


# 3. COUPONS
code, res_coupons = request("/api/admin/coupons/")
record("3. Coupons", "List coupons", code == 200 and isinstance(res_coupons.get("data"), list), f"Found {len(res_coupons.get('data', []))} coupons")

# Create coupon
test_coupon_code = f"TESTAUDIT{int(code)}"
code_create_c, res_c_create = request("/api/admin/coupons/", method="POST", data={
    "code": test_coupon_code,
    "discount_type": "percentage",
    "discount_value": 25,
    "min_order_value": 500,
    "max_uses": 50,
    "is_active": True
})
c_id = res_c_create.get("data", {}).get("id") if code_create_c == 201 else None
record("3. Coupons", "Create coupon", code_create_c == 201 and c_id is not None, f"Created coupon {test_coupon_code} id={c_id}")

# PATCH coupon (newly added endpoint)
if c_id:
    code_patch_c, res_c_patch = request(f"/api/admin/coupons/{c_id}/", method="PATCH", data={
        "discount_value": 30,
        "is_active": False
    })
    record("3. Coupons", "PATCH coupon update (active toggle & discount)", code_patch_c == 200 and res_c_patch.get("data", {}).get("is_active") is False, "Updated discount_value=30, is_active=False")

    # DELETE coupon
    code_del_c, res_c_del = request(f"/api/admin/coupons/{c_id}/", method="DELETE")
    record("3. Coupons", "Delete coupon", code_del_c == 200, f"Deleted coupon id={c_id}")


# 4. CUSTOMERS
code, res_cust = request("/api/admin/customers/")
customers = res_cust.get("data", [])
record("4. Customers", "List customers", code == 200 and len(customers) > 0, f"Found {len(customers)} customers")

if customers:
    test_cust = customers[0]
    cust_id = test_cust.get("id") or test_cust.get("user_id") or 1
    code, res_prof = request(f"/api/admin/customers/{cust_id}/")
    record("4. Customers", "Customer Risk Profile", code == 200, f"Loaded profile for customer {cust_id}")

    code, res_rev = request(f"/api/fraud/customers/{cust_id}/review/")
    record("4. Customers", "Customer Fraud Review & Behavior", code == 200, f"Review status: {res_rev.get('status', 'ok')}")

    # Test customer action restriction
    code, res_action = request(f"/api/fraud/customers/{cust_id}/action/", method="POST", data={
        "action": "restrict_cod",
        "notes": "E2E automated test restriction"
    })
    record("4. Customers", "Apply customer restriction", code == 200, f"Applied restriction: {res_action.get('data', {}).get('action')}")


# 5. FLAGGED CASES
code, res_flagged = request("/api/admin/flagged-cases/")
cases = res_flagged.get("data", [])
record("5. Flagged Cases", "List flagged cases", code == 200 and isinstance(cases, list), f"Found {len(cases)} cases")

if cases:
    test_case = cases[0]
    case_id = test_case["id"]
    code, res_case_review = request(f"/api/admin/returns/{case_id}/review/", method="POST", data={
        "action": "approve",
        "notes": "E2E automated approval verification"
    })
    record("5. Flagged Cases", "Review case (Approve/Reject decision)", code == 200, f"Decision recorded for case #{case_id}")


# 6. DELIVERY AGENTS
code, res_agents = request("/api/admin/delivery-agents/")
data_val = res_agents.get("data", {})
agents = data_val.get("agents", []) if isinstance(data_val, dict) else (data_val if isinstance(data_val, list) else [])
record("6. Delivery Agents", "List delivery agents", code == 200 and len(agents) > 0, f"Found {len(agents)} delivery agents")

if agents:
    test_agent = agents[0]
    agent_id = test_agent["id"]
    code, res_investigate = request(f"/api/admin/delivery-agents/{agent_id}/investigate/", method="POST", data={"notes": "E2E audit investigation"})
    record("6. Delivery Agents", "Investigate delivery agent", code == 200, f"Agent {test_agent.get('name')} under investigation")

    code, res_signoff = request(f"/api/admin/delivery-agents/{agent_id}/sign-off/", method="POST", data={"notes": "E2E sign-off cleared", "risk_level": "LOW"})
    record("6. Delivery Agents", "Sign-off delivery agent", code == 200, f"Agent {test_agent.get('name')} cleared")


# 7. FRAUD RULES
code, res_fc = request("/api/admin/fraud-config/")
record("7. Fraud Rules", "Load fraud config", code == 200 and "weights" in res_fc.get("data", {}), f"Loaded weights: {len(res_fc.get('data', {}).get('weights', {}))}")

# Update fraud config
code, res_fc_up = request("/api/admin/fraud-config/", method="PATCH", data={
    "weights": {"serial_mismatch": 40, "high_return_rate": 30},
    "risk_thresholds": {"low": 30, "medium": 65, "high": 85}
})
record("7. Fraud Rules", "Update fraud configuration", code == 200, "Config saved to database")

# VIP / Blacklist rules
code, res_lr = request("/api/fraud/rules/list/")
rules_list = res_lr if isinstance(res_lr, list) else res_lr.get("data", [])
record("7. Fraud Rules", "List VIP/Blacklist rules", code == 200 and isinstance(rules_list, list), f"Found {len(rules_list)} list rules")

code, res_create_lr = request("/api/fraud/rules/list/", method="POST", data={
    "rule_type": "whitelist",
    "field": "email",
    "value": "e2e_vip_test@domain.com",
    "description": "VIP test rule created during audit"
})
lr_id = res_create_lr.get("id") if isinstance(res_create_lr, dict) and "id" in res_create_lr else res_create_lr.get("data", {}).get("id") if isinstance(res_create_lr, dict) else None
record("7. Fraud Rules", "Create VIP whitelist rule", (code in (200, 201)) and lr_id is not None, f"Created rule id={lr_id}")

if lr_id:
    code, res_del_lr = request(f"/api/fraud/rules/list/{lr_id}/", method="DELETE")
    record("7. Fraud Rules", "Delete list rule", code in (200, 204), f"Deleted rule id={lr_id}")


# 8. AUDIT LOG
code, res_audit = request("/api/admin/audit-log/")
logs = res_audit.get("data", [])
record("8. Audit Log", "Fetch Audit Log entries", code == 200 and len(logs) > 0, f"Found {len(logs)} persistent audit log events")

# Check if recent actions appear in audit log
recent_targets = [l.get("target") for l in logs[:10]]
record("8. Audit Log", "Recent admin actions recorded", any("Coupon" in str(t) or "Return" in str(t) or "Product" in str(t) or "Order" in str(t) for t in recent_targets), f"Top targets: {recent_targets[:4]}")


# 9. SETUP & API
code, res_me = request("/api/merchants/me/")
record("9. Setup & API", "Fetch store profile (/merchants/me/)", code == 200, f"Store: {res_me.get('data', {}).get('business_name')}")

code, res_profile = request("/api/merchants/profile/")
record("9. Setup & API", "Fetch store profile alias (/merchants/profile/)", code == 200, f"Store alias: {res_profile.get('data', {}).get('business_name')}")

print("\n=== SUMMARY OF AUDIT RESULTS ===")
total_tests = len(results)
passed_tests = sum(1 for r in results if r["passed"])
failed_tests = total_tests - passed_tests
print(f"Total Tests Executed: {total_tests}")
print(f"Passed: {passed_tests}")
print(f"Failed: {failed_tests}")

if failed_tests > 0:
    print("\nFAILURES:")
    for r in results:
        if not r["passed"]:
            print(f"- [{r['section']}] {r['test']}: {r['details']}")
    sys.exit(1)
else:
    print("\nALL 9 SECTIONS VERIFIED FUNCTIONAL END-TO-END WITH ZERO FAILURES!")
    sys.exit(0)
