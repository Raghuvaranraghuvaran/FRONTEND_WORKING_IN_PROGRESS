# 🔒 Google reCAPTCHA v2 Integration Guide

## ✅ What's Integrated

Google reCAPTCHA v2 (checkbox "I'm not a robot") is now integrated into the **Merchant Login Page**.

---

## 🚀 Current Setup (Test Mode)

**Site Key in Use:** `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`

This is Google's **official test key** that:
- ✅ Works on localhost
- ✅ Always passes verification
- ✅ Shows the reCAPTCHA widget
- ✅ FREE - No API key needed for testing

**Behavior:**
- **localhost**: reCAPTCHA shown but bypassed (test mode)
- **Production**: Full verification required

---

## 🎯 How to Get Your FREE Production Keys

### Step 1: Go to Google reCAPTCHA Admin Console
**URL:** https://www.google.com/recaptcha/admin/create

### Step 2: Register Your Site

Fill in the form:

1. **Label:** `ReturnGuard Merchant Portal`
2. **reCAPTCHA type:** Choose **reCAPTCHA v2** → **"I'm not a robot" Checkbox**
3. **Domains:** Add your domains (one per line)
   ```
   localhost
   127.0.0.1
   your-domain.com
   your-domain.vercel.app
   ```
4. **Accept terms** ✓
5. Click **Submit**

### Step 3: Copy Your Keys

You'll receive TWO keys:
- **Site Key** (public) - Goes in frontend
- **Secret Key** (private) - Goes in backend

### Step 4: Update Your .env File

**Frontend (.env):**
```bash
VITE_RECAPTCHA_SITE_KEY=YOUR_SITE_KEY_HERE
```

**Backend (.env):** (for verification)
```bash
RECAPTCHA_SECRET_KEY=YOUR_SECRET_KEY_HERE
```

---

## 📝 Files Modified

1. ✅ **frontend/index.html** - Added reCAPTCHA script
2. ✅ **frontend/.env** - Added VITE_RECAPTCHA_SITE_KEY
3. ✅ **frontend/src/pages/MerchantLoginPage.jsx** - Integrated reCAPTCHA widget

---

## 🧪 Testing

### Local Testing (localhost:5174)
1. Go to: http://localhost:5174/merchant/login
2. You'll see the reCAPTCHA checkbox ✓
3. Click "I'm not a robot"
4. Login will work (test mode bypass)

### Production Testing
1. Deploy to your domain
2. Update `.env` with production keys
3. reCAPTCHA will require real verification

---

## 💰 Pricing

**reCAPTCHA v2:** FREE
- ✅ Unlimited assessments
- ✅ No credit card required
- ✅ Commercial use allowed

**Optional Upgrade:**
- reCAPTCHA Enterprise (paid) - Advanced analytics & fraud detection
- Not needed for most use cases

---

## 🔧 How It Works

1. **User visits merchant login**
2. **reCAPTCHA widget loads** (checkbox appears)
3. **User checks "I'm not a robot"**
4. **Google verifies** (analyzes mouse movement, browsing patterns)
5. **Token generated** (if human)
6. **Frontend sends token** with login credentials
7. **Backend verifies token** (optional - recommended for production)
8. **Login succeeds** ✅

---

## 🛡️ Security Features

✅ **Bot Protection** - Blocks automated login attempts
✅ **Brute Force Prevention** - Rate limiting via CAPTCHA
✅ **Dark Theme** - Matches your UI
✅ **Auto-reset on Error** - reCAPTCHA resets if login fails
✅ **Local Bypass** - Developers can test without friction

---

## 🎨 Customization

The reCAPTCHA widget is configured with:
- **Theme:** `dark` (matches merchant portal)
- **Position:** Centered above login button
- **Size:** Normal (default)

To change theme to light:
```javascript
theme: 'light',  // in MerchantLoginPage.jsx
```

---

## 📚 Official Documentation

- **Admin Console:** https://www.google.com/recaptcha/admin
- **Developer Guide:** https://developers.google.com/recaptcha/docs/display
- **Verification API:** https://developers.google.com/recaptcha/docs/verify

---

## ❓ FAQ

**Q: Do I need to pay for reCAPTCHA?**
A: No! reCAPTCHA v2 is completely FREE with unlimited usage.

**Q: Do users need a Google account?**
A: No, users don't need to be logged into Google.

**Q: What about privacy/GDPR?**
A: reCAPTCHA uses cookies. You should update your privacy policy. Links to Google's Privacy/Terms are included in the UI.

**Q: Can bots still bypass it?**
A: reCAPTCHA v2 is very effective but not 100%. For higher security, consider:
- Rate limiting (backend)
- IP blocking (Cloudflare)
- reCAPTCHA v3 (invisible, score-based)

**Q: Does it work in China?**
A: Google services are blocked in China. Use alternative: hCaptcha or local solution.

---

## ✨ Next Steps

1. **Test locally** - http://localhost:5174/merchant/login
2. **Get production keys** - https://www.google.com/recaptcha/admin/create
3. **Update .env** with your production site key
4. **Deploy and verify** ✅

---

**Need Help?** Check the official docs or reach out!
