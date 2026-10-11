# Quality Assurance & Testing Checklist

**System:** Akubrecah Engineering Portfolio & Integrated Admin CMS  
**Standards:** OWASP Top 10, WCAG 2.1 AA, Core Web Vitals, Strict TypeScript  

---

## 1. Functional Verification Checklist

### Public Website
- [ ] **Homepage (`/`):**
  - [ ] Hero headlines, engineering positioning, and live metric counters render cleanly.
  - [ ] Featured projects and case studies load from the database without layout shift.
  - [ ] Service overview cards link directly to relevant service sections.
  - [ ] Client logos and tech stack marquee animate smoothly with hardware acceleration.
- [ ] **Projects Catalog (`/projects` & `/projects/[slug]`):**
  - [ ] Filter by category (All, SaaS, Fintech, GovTech, Mobile) works accurately.
  - [ ] Project detail page renders case study problem, architecture, stack, outcomes, and live URLs.
  - [ ] Draft or unpublished projects are inaccessible publicly and return 404.
- [ ] **Articles Catalog (`/articles` & `/articles/[slug]`):**
  - [ ] Articles list displays categories, reading time, publication dates, and excerpts.
  - [ ] Article detail page renders markdown content safely with syntax highlighting.
  - [ ] Unpublished drafts return 404 on public routes.
- [ ] **About & Biography (`/about`):**
  - [ ] Engineering background, principles, work history, and skills matrix render accurately.
  - [ ] Download Resume button links to verified CV file.
- [ ] **Contact Form (`/contact`):**
  - [ ] Form submission persists real record in `inquiries` database table.
  - [ ] Client-side validation triggers on invalid emails or empty required fields.
  - [ ] Success state displays immediate confirmation without mock timeouts.

### Admin Dashboard & CMS
- [ ] **Authentication & Access Gate:**
  - [ ] Non-logged-in users visiting `/admin` are presented with Master Passcode Gate Modal.
  - [ ] Entering correct PIN (`8426`) sets cryptographic HMAC cookies and unlocks dashboard.
  - [ ] Clerk Super Admin (`poweldayck@gmail.com`) logs in seamlessly.
  - [ ] WhatsApp bot command `!link` generates 4-hour cryptographic login link.
- [ ] **Projects Manager (`/admin/projects`):**
  - [ ] Create new project: saves all fields (slug, title, stack, URLs, case study, publish toggle).
  - [ ] Edit existing project: updates persist and immediately reflect on public `/projects`.
  - [ ] Delete project: prompts confirmation modal and deletes safely.
- [ ] **Articles Manager (`/admin/articles`):**
  - [ ] Create article: Markdown editor updates body, slug, tags, and reading time.
  - [ ] Toggle publish status: changes visibility on public `/articles` instantly.
- [ ] **Inquiries CRM (`/admin/inquiries`):**
  - [ ] Newly submitted website inquiries appear with status `New`.
  - [ ] Status updates (`New` -> `Contacted` -> `Qualified` -> `Proposal Sent` -> `Won`) persist.
  - [ ] Adding internal note saves note with timestamp and author name.
  - [ ] Export to CSV downloads complete sanitized inquiry list.
- [ ] **Site Settings (`/admin/settings`):**
  - [ ] Modifying hero text, contact info, or social links updates public footer and hero.

---

## 2. Security Verification Checklist

- [ ] **Route Protection:**
  - [ ] `GET /api/admin/*` endpoints reject unauthenticated requests with `401 Unauthorized` or `403 Forbidden`.
  - [ ] Admin actions cannot be forged by ordinary client tokens.
- [ ] **Secret Leakage Prevention:**
  - [ ] No database credentials, Clerk secret keys, Paystack secret keys, or Evolution webhook secrets exist in client-side bundles.
  - [ ] Verified via `git grep "sk_live"` and bundle inspection.
- [ ] **Input Sanitization & Injection Prevention:**
  - [ ] All database queries use parameterized Prisma queries (prevention of SQL injection).
  - [ ] Rich-text/Markdown rendering escapes raw script tags (prevention of XSS).
- [ ] **Form Spam & Rate Limiting:**
  - [ ] `/api/inquiries` endpoint is protected by rate limiting in `proxy.ts`.

---

## 3. Regression Verification (Existing Platform Features)

- [ ] **KRA Retrieval Portal (`/retrieval-portal`):**
  - [ ] Taxpayer National ID / PIN verification remains 100% operational.
  - [ ] In-memory RAM PDF certificate generation streams correctly without server storage.
- [ ] **Payment Gateways:**
  - [ ] Safaricom Daraja M-Pesa STK push dispatches successfully.
  - [ ] Paystack payment initialization and verification functions properly.
- [ ] **WhatsApp Bot:**
  - [ ] Inbound webhook at `/api/whatsapp/webhook` processes commands.
  - [ ] `!admin`, `!stats`, and `!link` commands function on WhatsApp.

---

## 4. Performance, Accessibility & Responsiveness

- [ ] **Viewport Breakpoints:**
  - [ ] Mobile (375px): Navigation drawer, responsive cards, no horizontal scrolling.
  - [ ] Tablet (768px): Collapsed admin sidebar, 2-column project grids.
  - [ ] Desktop (1440px): Full expanded layouts, fluid typography.
- [ ] **Accessibility (WCAG 2.1 AA):**
  - [ ] Visible focus indicators on all interactive inputs and buttons.
  - [ ] Color contrast ratio >= 4.5:1 for standard text.
  - [ ] Proper semantic headings (`<h1>`, `<h2>`, `<article>`, `<nav>`).
- [ ] **Build & Typecheck:**
  - [ ] `npx tsc --noEmit` exits with `0` (Zero TypeScript errors).
  - [ ] `npm run build` exits with `0` (Successful production build).
