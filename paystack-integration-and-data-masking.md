# Plan: Paystack Integration & Data Masking Access Control

## Context & Objectives
Integrate Paystack payment gateway into the Akubrecah KRA Certificate Portal alongside the existing M-Pesa flow, supporting both:
1. **Monthly Subscription** (unlimited full record views & certificate downloads)
2. **Pay-Per-Download** (single certificate download)

Enforce strict server-side and client-side data privacy masking for unsubscribed users:
- **Phone Number**: Completely hidden (not shown at all).
- **Email Address**: Partially masked (e.g. `j***e@domain.com`).
- **Location Details**: Completely hidden (County, City/Town, Sub-County/District, Tax Area, KRA Station, Building, Street, P.O. Box, Postal Code).
- **KRA PIN**: Partially masked (e.g. `A01*****8Z`).
- **Name**: Taxpayer full legal name remains fully visible.

---

## Architecture & Data Flow

```
[Unsubscribed User]
       │
       ▼ Search ID / PIN
[POST /api/kra/retrieve]
       │
       ├─► Check Clerk Auth & Active Prisma Subscription
       │   ├─ If NOT Subscribed:
       │   │    • Mask PIN (A01*****8Z)
       │   │    • Hide Phone ("")
       │   │    • Mask Email (j***@domain.com)
       │   │    • Hide Location Details ("")
       │   │    • Set `isSubscribed: false`
       │   └─ If Subscribed:
       │        • Return ALL fields in full
       │        • Set `isSubscribed: true`
       ▼
[Frontend: KRAPortal]
       ├─ Shows Full Name
       ├─ Shows Masked PIN & Email
       ├─ Shows Locked/Blurred Location & Phone with "Subscribers Only" badge
       └─ Options to Unlock:
            ├─ Paystack Monthly Subscription (KES 499)
            ├─ Paystack Single Download (KES 30)
            └─ M-Pesa Direct STK Push (KES 30)
```

---

## Implementation Tasks

### Phase 1: Security & Masking Helpers
- [x] Create `lib/masking.ts` with pure, thoroughly tested functions:
  - `maskEmail(email: string): string`
  - `maskPin(pin: string): string`
  - `maskTaxpayerData(data, isSubscribed: boolean): object`
- [x] Create `lib/subscription.ts` to check Clerk user active subscription from Prisma PostgreSQL database.

### Phase 2: Server-Side Retrieval Route Hardening
- [x] Update `app/api/kra/retrieve/route.ts`:
  - Identify Clerk user ID from `auth()`.
  - Check active subscription status.
  - Apply `maskTaxpayerData` on all responses to prevent network-level leakage.

### Phase 3: Paystack Gateway Service & API Endpoints
- [x] Create `lib/paystack.ts`:
  - `initializeTransaction({ email, amount, currency, reference, callbackUrl, metadata })`
  - `verifyTransaction(reference: string)`
- [x] Create `app/api/paystack/initialize/route.ts`:
  - Handles initialization for both `subscription` and `pay_per_download`.
- [x] Create `app/api/paystack/verify/route.ts`:
  - Verifies payment, creates/updates `Subscription` or `CertificateDownload` in Prisma.
- [x] Create `app/api/paystack/webhook/route.ts`:
  - HMAC SHA512 signature verification for asynchronous webhook handling.

### Phase 4: Frontend UI Enhancements (`components/kra-portal.tsx`)
- [x] Update taxpayer review screen (Step 4):
  - Display full legal name.
  - Display partially masked PIN and email when unsubscribed.
  - Display locked indicators for phone number and location details with upgrade banner.
- [x] Update Payment Modal (`checkAccess`):
  - Payment method tabs: "Paystack (Card / Apple Pay / M-Pesa)" vs "Direct M-Pesa STK".
  - Tier selection: "Monthly Unlimited Subscription (KES 499)" vs "Single Download (KES 30)".
  - Seamless inline/popup or redirection handling with auto-refresh on return.

### Phase 5: Verification & Testing
- [x] Execute TypeScript typecheck (`npx tsc --noEmit`).
- [x] Verify API endpoint structure and response formats.
- [x] Update `.env.example` with Paystack variables.

### Phase 6: Clerk User DB Auto-Provisioning (Bug Fix)
- [x] Resolved "User record not found. Please complete your profile" error:
  - Upgraded `getOrCreateDbUser` in `lib/subscription.ts` to automatically fetch Clerk profile (email, name) and safely upsert into the Prisma `users` table.
  - Updated `app/api/certificate/record-download/route.ts`, `app/api/generate-certificate/route.ts`, and `app/api/certificate/check-access/route.ts` to use `getOrCreateDbUser`.
  - Added `retryConfirmDownload` in `components/kra-portal.tsx` allowing one-click download confirmation if payment already succeeded.
