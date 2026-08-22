# Demo Credentials

Use these credentials to test the application in mock mode (no backend required).

## Shopper Account
- **Email:** demo@shopper.com
- **Password:** demo123

## Merchant Account
- **Email:** demo@merchant.com
- **Password:** demo123

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

## Google Sign-In

Google Sign-In is configured but requires mock mode or a running backend to work properly.
