# Existing System Audit: Akubrecah Platform & Portfolio

**Audit Date:** October 11, 2026  
**Auditor:** Antigravity Engineering & Architecture  
**Target Application:** [https://akubrecah.vercel.app](https://akubrecah.vercel.app)  
**Workspace:** `/Users/Akubrecah/Desktop/Akubrecah KRA`  
**GitHub Repositories Investigated:**
- Production Workspace: `https://github.com/Akubrecah/akubrecah-kra-certificate-portal.git` (deployed on Vercel)
- Reference Fork: `https://github.com/Akubrecah/portfolio` (upstream fork of `HamishMW/portfolio` using Remix & Cloudflare Pages)

---

## 1. Executive Summary & Repository Reality Check

A primary requirement of this audit was resolving the divergence between the public repository reference (`https://github.com/Akubrecah/portfolio`) and the live deployed website (`https://akubrecah.vercel.app`).

### Verified Findings:
1. **Reference Repository (`Akubrecah/portfolio`):**
   - Fork of `HamishMW/portfolio` created in 2017/2024.
   - Built on **Remix**, React 18, Three.js cyberpunk shaders, and Cloudflare Pages workers (`app/routes/home/home.jsx`, `app/routes/contact/contact.jsx`, `posts.server.js`, Amazon SES, MDX).
   - This repository is **not** the codebase running on `https://akubrecah.vercel.app`.
2. **Actual Live Production Workspace (`Akubrecah KRA`):**
   - Built on **Next.js 16.1.1** (Turbopack), **React 19**, **TypeScript** (Strict), **Tailwind CSS**, and **Radix UI**.
   - Deployed live on Vercel at `https://akubrecah.vercel.app` and `https://kra-certificate.vercel.app`.
   - Backed by **Neon PostgreSQL** via **Prisma ORM 6.2.1** with direct pooled connections.
   - Features **Clerk Authentication** (`@clerk/nextjs 7.2.8`) using `proxy.ts` (Next.js middleware convention).
   - Features an operational **Evolution API WhatsApp Bot** (self-hosted on VPS `169.58.96.131:8085`), real **Paystack Gateway** live transactions, and **Safaricom M-Pesa Daraja STK Push**.
   - Contains an Executive Admin Dashboard at `/admin` with real-time financial reconciliation and device telemetry.

**Architectural Decision:** Per the master prompt rules (*"Do not immediately replace the existing architecture, delete existing functionality... This is an enhancement and integration project, not a greenfield rebuild"*), we must **enhance and redesign this active Next.js 16 production codebase**. Migrating backwards to the legacy Remix fork would destroy existing Kenyan compliance features, Paystack integrations, Clerk auth, and WhatsApp telemetry.

---

## 2. Technical Stack & Runtime Environment

| Layer | Verified Technology | Version / Specification |
|---|---|---|
| **Framework** | Next.js (App Router, Turbopack) | `16.1.1` |
| **Runtime & Language** | Node.js / TypeScript | TypeScript `5.x`, Strict Typing |
| **UI Library** | React | `19.0.0` |
| **Styling** | Tailwind CSS & CSS Modules | Custom design system tokens (`globals.css`) |
| **Component Primitives** | Radix UI | Accordion, Dialog, Dropdown, Tabs, Tooltip |
| **Animation & Motion** | Framer Motion / Motion | `motion 12.26.2` |
| **Authentication** | Clerk Auth | `@clerk/nextjs 7.2.8` via `proxy.ts` |
| **Database ORM** | Prisma Client | `6.2.1` |
| **Database Host** | Neon PostgreSQL (AWS us-east-1) | Pooled + Direct connection strings |
| **Payment Gateways** | Paystack + Safaricom Daraja STK | Live API keys, webhook handlers |
| **WhatsApp Automation** | Evolution API (Baileys) | Self-hosted Linux VPS (`169.58.96.131:8085`) |
| **PDF Generation** | PDF-Lib + Canvas/QRCode | In-memory RAM streaming (Zero server PDF storage) |
| **Hosting & CDN** | Vercel | Edge routing, Serverless Functions (Max duration 30-60s) |

---

## 3. Public Route Inventory & Current State

| Route | Purpose | Current Implementation State | Redesign / Enhancement Need |
|---|---|---|---|
| `/` | Homepage | Client component with hero counter, KRA portal tools list, compliance highlights, customer marquee. | Redesign into high-impact software engineering portfolio with hero positioning, featured client case studies, live service highlights, and verified stats. |
| `/about` | Engineering profile & methodology | Static copy highlighting principles, tech stacks, and team philosophy. | Enhance into interactive biography, verified engineering milestones, skills matrix, and downloadable resume/CV. |
| `/services` | Engineering services | Grid of service cards with inquiry CTA buttons. | Connect to CMS-driven service catalog with itemized deliverables, methodology, and direct consultation booking. |
| `/solutions` | Enterprise solutions | Static solution categories (Fintech, GovTech, SaaS). | Convert into live architecture showcase and case studies. |
| `/products` | In-house products | Showcase of KRA portal and compliance tools. | Maintain existing products while expanding showcase cards and live demo links. |
| `/contact` | Engagement & inquiry | Simulated form with client-side `setTimeout(r, 1200)`. | **CRITICAL FIX NEEDED:** Replace mock submission with database persistence (`inquiries` table), server-side validation, rate limiting, and optional email notifications. |
| `/retrieval-portal` | Instant KRA Certificate retrieval | Fully functional KRA PIN / ID lookup with Daraja STK / Paystack and instant PDF streaming. | **PRESERVE UNTOUCHED.** High-traffic revenue-generating module. |
| `/pin-checker` | Free KRA PIN checker | Functional live verification with captcha bypass. | **PRESERVE UNTOUCHED.** |
| `/checkout/*` | Daraja / Paystack checkout flows | Live transaction processing. | **PRESERVE UNTOUCHED.** |

---

## 4. Admin System Inventory & Current State

The repository currently features an Executive Administration Dashboard at `/admin` (`app/admin/page.tsx` and `app/admin/layout.tsx`):

### Existing Admin Capabilities:
1. **Executive Overview (`/admin`):**
   - Real-time gross revenue calculation matching Paystack balance (`KES 1,360` live).
   - Real-time device usage telemetry (Desktop 65% vs Mobile 35%).
   - Funnel metrics (Lookups -> Checkouts -> Completed Downloads).
   - WhatsApp Bot adoption stats (10 users, 5 downloads).
   - Searchable transaction history with instant certificate download (Zero-server PDF storage).
2. **Sub-Modules:**
   - `/admin/kra-retrievals`: Retrieval logs and taxpayer lookup.
   - `/admin/system-health`: Uptime, Clerk user count, CPU load, memory, and database status.
   - `/admin/user-management`: Clerk user list, role modification (Admin/User).
   - `/admin/role-access`: Permission matrix.
   - `/admin/system-logs`: Database audit logs (`system_logs` table).
   - `/admin/global-config`: System configuration toggles.
3. **Authentication Layer:**
   - Dual-layer: Clerk Super Admin (`poweldayck@gmail.com`) OR Master PIN (`8426`) with 4-hour cryptographic HMAC cookie (`admin_magic_auth`).
   - WhatsApp Bot Admin command center (`!stats`, `!revenue`, `!link`, `!logs`).

### Missing Admin CMS Modules (Identified from Master Prompt):
1. **Website Content CMS:** Editable hero content, biography, profile photo, social links, resume download.
2. **Projects & Case Studies Manager:** Full CRUD for client projects, technology tags, live URLs, GitHub URLs, architecture breakdowns, problem/solution write-ups, and display ordering.
3. **Articles & Blog CMS:** Rich-text/Markdown editing, drafts, categories, tags, SEO canonicals, publication scheduling.
4. **Skills & Experience CMS:** Manage technical skill groups, proficiency, work history, and certifications.
5. **Services Manager:** Manage service offerings, pricing tiers, and inquiry options.
6. **Inquiries CRM:** Real database table for contact form submissions with statuses (`New`, `Contacted`, `Qualified`, `Proposal Sent`, `Won`, `Lost`), internal notes, and CSV export.
7. **SEO & Metadata Manager:** Page-by-page SEO title, meta description, OG social images, robots directives, and dynamic XML sitemap generation.
8. **Media Library:** Asset management with file validation, dimensions, and secure storage links.
9. **Testimonials Manager:** Real, verified client endorsements with permission status and case study association.

---

## 5. Security & Architectural Risk Assessment

1. **Contact Form Fake Persistence:**
   - *Risk:* `app/contact/page.tsx` currently mocks submission via `setTimeout`. Real client inquiries are dropped without being saved.
   - *Mitigation:* Implement `inquiries` Prisma schema model, transactional persistence at `POST /api/inquiries`, and CSRF/rate limiting.
2. **Secrets & Privileged Access:**
   - *Audit Result:* No API keys or service role secrets are exposed in client-side bundles. `CLERK_SECRET_KEY`, `PAYSTACK_SECRET_KEY`, `DATABASE_URL`, and `EVOLUTION_API_KEY` remain strictly server-side.
3. **Clerk Middleware Routing:**
   - *Audit Result:* Verified that `proxy.ts` allows public access to portfolio routes and uses `verifyAdminCaller` on server-side admin endpoints.

---

## 6. Functional Preservation Mandates

The following functioning capabilities must **never** be broken or altered during the redesign:
- KRA Retrieval Portal (`/retrieval-portal`) & PIN verification (`/api/kra/*`).
- Paystack & M-Pesa STK push checkout processing (`/api/paystack/*`, `/api/mpesa/*`).
- Instant in-memory RAM PDF certificate generation (`/api/generate-certificate`).
- Evolution API WhatsApp Bot webhook handler (`/api/whatsapp/webhook`) and background payment polling.
- Zero Server Storage policy for taxpayer compliance documents.
