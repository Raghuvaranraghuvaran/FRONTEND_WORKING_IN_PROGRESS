$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) {
    $edge = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}
$baseDir = "C:\Users\ADMIN\OneDrive\Desktop\FRONTEND_WORKING_IN_PROGRESS\screenshots"
if (-not (Test-Path $baseDir)) {
    New-Item -ItemType Directory -Force -Path $baseDir | Out-Null
}

Write-Output "Output Directory: $baseDir"

# 1. Landing Page
& $edge --headless --disable-gpu --screenshot="$baseDir\1_shopper_landing_page.png" --window-size=1280,800 "http://localhost:5173/"

# 2. Shop Catalog
& $edge --headless --disable-gpu --screenshot="$baseDir\2_shopper_catalog.png" --window-size=1280,800 "http://localhost:5173/shop"

# 3. Merchant Dashboard
& $edge --headless --disable-gpu --screenshot="$baseDir\3_merchant_dashboard.png" --window-size=1280,800 "http://localhost:5173/merchant/dashboard"

# 4. Merchant Flagged Cases
& $edge --headless --disable-gpu --screenshot="$baseDir\4_flagged_cases_queue.png" --window-size=1280,800 "http://localhost:5173/merchant/flagged-cases"

# 5. Merchant Flagged Case Detail (28 Checkpoints + Risk Breakdown)
& $edge --headless --disable-gpu --screenshot="$baseDir\5_flagged_case_detail.png" --window-size=1280,900 "http://localhost:5173/merchant/flagged-cases/ret-1"

# 6. Merchant Fraud Configuration
& $edge --headless --disable-gpu --screenshot="$baseDir\6_fraud_rule_configuration.png" --window-size=1280,800 "http://localhost:5173/merchant/fraud-config"

# 7. Merchant Delivery Agents (Collusion Monitor)
& $edge --headless --disable-gpu --screenshot="$baseDir\7_delivery_agents_collusion.png" --window-size=1280,800 "http://localhost:5173/merchant/delivery-agents"

Get-ChildItem $baseDir | Select-Object Name, Length, LastWriteTime
