# CAPTCHA Implementation Guide

## Recommendation: **reCAPTCHA v3** (Invisible, Better UX)

reCAPTCHA v3 runs invisibly in the background and scores users based on their behavior. No checkbox needed!

## Why CAPTCHA?

✅ **Prevents automated bot submissions**  
✅ **Reduces spam and abuse**  
✅ **Protects against form flooding**  
✅ **Free for reasonable usage**  
✅ **Better UX than traditional CAPTCHAs**

## Implementation Steps

### 1. Get reCAPTCHA Keys

1. Go to https://www.google.com/recaptcha/admin/create
2. Register a new site:
   - **Label**: Training Daydreamers Intake Form
   - **reCAPTCHA type**: reCAPTCHA v3
   - **Domains**: 
     - `localhost` (for development)
     - `admin.training.daydreamersnyc.com` (production)
     - `training.daydreamersnyc.com` (if different)
3. Accept terms and submit
4. Copy your **Site Key** and **Secret Key**

### 2. Add Environment Variables

Add to `.env.local`:
```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

### 3. Install reCAPTCHA Package

```bash
npm install react-google-recaptcha-v3
```

### 4. Add reCAPTCHA Provider

Update `app/layout.tsx` to include the reCAPTCHA provider:

```typescript
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <GoogleReCaptchaProvider
          reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
          scriptProps={{
            async: false,
            defer: false,
            appendTo: 'head',
            nonce: undefined,
          }}
        >
          {children}
        </GoogleReCaptchaProvider>
      </body>
    </html>
  );
}
```

### 5. Add CAPTCHA to Intake Form

In `app/portal/intake/page.tsx`:

```typescript
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

// Inside component:
const { executeRecaptcha } = useGoogleReCaptcha();

// In handleSubmit:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Get reCAPTCHA token
  if (!executeRecaptcha) {
    alert('reCAPTCHA not loaded. Please refresh and try again.');
    return;
  }

  const recaptchaToken = await executeRecaptcha('submit_intake_form');

  // ... existing validation ...

  // Include token in submission
  const response = await fetch('/api/clients/intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...formData,
      recaptchaToken, // Add this
      additionalContacts: formData.additionalContacts.filter(c=>c.name||c.email||c.phone),
      waiverSigned: formData.waiverSigned
    })
  });
  // ... rest of submission
};
```

### 6. Verify CAPTCHA on Server

Create `/api/recaptcha/verify/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { token } = await request.json();

  const response = await fetch(
    `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    { method: 'POST' }
  );

  const data = await response.json();

  return NextResponse.json({
    success: data.success,
    score: data.score, // 0.0 to 1.0 (1.0 = very likely human)
  });
}
```

### 7. Verify in Intake API

In `app/api/clients/intake/route.ts`:

```typescript
// After rate limiting check:
if (recaptchaToken) {
  const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:7777'}/api/recaptcha/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: recaptchaToken }),
  });
  
  const verifyData = await verifyRes.json();
  
  if (!verifyData.success || verifyData.score < 0.5) {
    // Score < 0.5 indicates likely bot
    return NextResponse.json(
      { success: false, error: 'reCAPTCHA verification failed. Please try again.' },
      { status: 400 }
    );
  }
}
```

## Score Thresholds

- **0.9 - 1.0**: Very likely human ✅
- **0.7 - 0.9**: Likely human ✅
- **0.5 - 0.7**: Suspicious ⚠️ (may want to block)
- **0.0 - 0.5**: Very likely bot ❌ (should block)

**Recommendation**: Block scores < 0.5, allow scores >= 0.5

## Alternative: Cloudflare Turnstile

If you prefer Cloudflare:
- Free alternative to reCAPTCHA
- Better privacy (no Google tracking)
- Similar implementation
- Requires Cloudflare account

## Current Status

✅ **Rate limiting implemented** (protects against basic DDoS)  
⏳ **CAPTCHA**: Ready to implement (follow guide above)  
✅ **Vercel DDoS protection**: Active  
✅ **AWS Shield Standard**: Active (free)

## Cost

- **reCAPTCHA v3**: Free for up to 1 million requests/month
- **Rate limiting**: Free (in-memory) or ~$10/month (Redis-based)
- **Total additional cost**: $0-10/month

