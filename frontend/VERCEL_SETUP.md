# Vercel Deployment Setup

## Environment Variables

To run the app on Vercel in **mock mode** (no backend required), configure these environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add the following variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `VITE_API_URL` | *(leave empty)* | Empty value enables mock data mode |
| `VITE_GOOGLE_CLIENT_ID` | `511413180726-tks4agohomumjqluivasu15doe31giim.apps.googleusercontent.com` | Google OAuth client ID (optional) |

## Important Notes

- **Leave `VITE_API_URL` completely empty** (no value at all) to use mock data mode
- If you enter a backend URL in `VITE_API_URL`, the app will try to connect to that backend
- The Google Client ID is optional - leave empty to disable Google sign-in

## After Setting Variables

1. Trigger a new deployment (push to main or click "Redeploy" in Vercel)
2. Test with demo credentials:
   - **Shopper:** demo@shopper.com / demo123
   - **Merchant:** demo@merchant.com / demo123

## Build Configuration

The `vercel.json` file is already configured with:
- Build command: `npm run build`
- Output directory: `dist`
- Framework: `vite`
- SPA routing enabled (all routes redirect to index.html)
