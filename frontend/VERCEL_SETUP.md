# Vercel Deployment Setup

## Environment Variables

To run the app on Vercel with registered accounts, orders, and invoice emails, configure these environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add the following variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `VITE_API_URL` | `https://your-backend.example.com/api` | Deployed Django API URL |
| `VITE_GOOGLE_CLIENT_ID` | `511413180726-tks4agohomumjqluivasu15doe31giim.apps.googleusercontent.com` | Google OAuth client ID (optional) |

## Important Notes

- A blank `VITE_API_URL` enables mock data mode. Mock mode cannot persist newly registered users or send real invoice emails.
- Set `VITE_API_URL` to the deployed Django API URL for real registration, login, orders, and invoice delivery.
- Configure the backend SMTP variables and run the Celery worker in production so invoice email tasks are delivered.
- The Google Client ID is optional - leave empty to disable Google sign-in.

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
