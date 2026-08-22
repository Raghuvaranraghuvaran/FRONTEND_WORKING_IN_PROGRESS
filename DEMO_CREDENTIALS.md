# Demo Credentials

Use these credentials to test the application in mock mode (no backend required).

## Shopper Account
- **Email:** demo@shopper.com
- **Password:** demo123
- **Google Sign-In:** ✅ Works in mock mode (logs in as Demo Shopper)

## Merchant Account
- **Email:** demo@merchant.com
- **Password:** demo123
- **Google Sign-In:** ✅ Works in mock mode (logs in as Demo Merchant)

## Mock Mode Setup

The application is configured to use mock data by default. To enable this:

1. Ensure `frontend/.env` has an empty `VITE_API_URL`:
   ```
   VITE_API_URL=
   ```

2. If you want to connect to a live backend, update `VITE_API_URL`:
   ```
   VITE_API_URL=http://127.0.0.1:8000/api
   ```

## Features Available in Demo

- Dashboard with stats and recent orders
- Product browsing and search
- Shopping cart
- Profile management with photo upload
- Barcode generation for member ID
- Order history
- Merchant portal (login with merchant credentials)
- **Google Sign-In** (mock mode - no real Google account needed)

## Google Sign-In in Mock Mode

- Click "Continue with Google" button
- Any Google account sign-in will work
- **Shopper login:** Redirects to demo shopper account
- **Merchant login:** Redirects to demo merchant account
- No actual Google verification happens in mock mode
