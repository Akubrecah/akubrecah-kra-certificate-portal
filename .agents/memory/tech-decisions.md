---
type: project
created: 2026-07-18
updated: 2026-07-18
---

# Technical Decisions

- Component metadata uses SemVer while the toolkit release keeps CalVer.
- `manifest.json` and `manifest.lock.json` must remain synchronized with component frontmatter.
- Cyber Cafe Monthly Subscription (KES 500): Stacking renewal policy (+30 days appended to active expiry), fair-use daily limit (100 lookups/day), in-memory PDF tax invoice dispatch via Evolution API with zero payment prompts on active status.
- Web Cyber Cafe Subscription & Above-The-Fold Portal: Logged-in Clerk users access cyber subscription status on `/dashboard` and `/retrieval-portal` with days remaining countdown, instant M-Pesa STK Push / Paystack checkout, and streaming A4 fiscal invoice PDFs. Retrieval portal features a split layout placing `KRAPortal` above the fold with WCAG AAA high-contrast inputs and real-time Radar Scanning HUD.

