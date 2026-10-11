# Implementation Plan: Redesign & Production CMS Integration

**Project:** Akubrecah Engineering Portfolio & Integrated Administration System  
**Framework:** Next.js 16.1.1 (App Router), React 19, TypeScript, Prisma, Neon PostgreSQL, Clerk  
**Methodology:** 9-Phase Sequential Vertical Slices (Vibe Coding Loop)  

---

## Phase Matrix & Chunk Schedule

```
Chunk 1: Discovery & Audit (Completed)
   │
Chunk 2: Design System & Public Website Redesign
   │
Chunk 3: Database & Administration Foundation
   │
Chunk 4: Core Content CMS (Projects, Case Studies, Skills, Services)
   │
Chunk 5: Articles & Publication Workflow
   │
Chunk 6: Contact CRM & Lead Management
   │
Chunk 7: Dynamic SEO Manager & Analytics Integration
   │
Chunk 8: Website Settings, Appearance & Security Hardening
   │
Chunk 9: Quality Assurance, Verification & Production Deployment
```

---

## Detailed Chunk Breakdown

### Chunk 1: Discovery and Implementation Plan (Completed)
- **Objective:** Audit the existing application, compare against the legacy GitHub repository, verify deployed runtime configuration, and generate baseline documentation.
- **Deliverables:**
  - `docs/EXISTING_SYSTEM_AUDIT.md`
  - `docs/ARCHITECTURE.md`
  - `docs/IMPLEMENTATION_PLAN.md`
  - `docs/TESTING_CHECKLIST.md`
- **Verification:** Completed and committed.

---

### Chunk 2: Design System & Public Website Redesign
- **Objective:** Redesign the public website into an authoritative, distinctive software engineering portfolio showcasing deep technical ability, engineering rigor, client case studies, and clear calls to action.
- **Key Modules:**
  1. **Global Navigation & Brand Header (`components/site-header.tsx`):**
     - Modern glassmorphism header with active route highlighting, command palette shortcut, responsive mobile menu drawer, and direct consultation CTA.
  2. **Hero & Professional Positioning (`app/page.tsx`):**
     - Technical title, high-impact value proposition, animated live metric counters, featured client logos, terminal-style tech stack badge ticker.
  3. **Featured Projects & Case Studies Showcase (`app/projects/page.tsx`, `app/projects/[slug]/page.tsx`):**
     - Filterable project grid (All, SaaS, Fintech, GovTech, Mobile).
     - Case study view with problem statement, architectural diagram, technical decisions, live demo, and measurable impact metrics.
  4. **Interactive Biography & Experience (`app/about/page.tsx`):**
     - Software engineer background, core principles, technical timeline, grouped skills matrix, downloadable resume button.
  5. **Engineering Services Catalog (`app/services/page.tsx`):**
     - Itemized services: Architecture Consulting, Full-Stack SaaS, Payment Gateways, Enterprise Modernization.
  6. **Technical Articles & Insights (`app/articles/page.tsx`, `app/articles/[slug]/page.tsx`):**
     - Tutorial and engineering write-ups with category badges, reading time, and clean typography.
  7. **Real Contact & Consultation Portal (`app/contact/page.tsx`):**
     - Connect form to real backend persistence, replace mocked `setTimeout`, add input validation and immediate confirmation.
- **Verification:**
  - `npm run typecheck`
  - Browser visual check at mobile (375px), tablet (768px), desktop (1440px).

---

### Chunk 3: Database & Administration Foundation
- **Objective:** Extend Prisma schema with production-grade CMS models and create robust, authenticated API route handlers.
- **Key Modules:**
  1. **Prisma Schema Update (`prisma/schema.prisma`):**
     - Add models: `Project`, `Article`, `Inquiry`, `InquiryNote`, `SkillCategory`, `Skill`, `WorkExperience`, `ServiceOffering`, `Testimonial`, `SiteSetting`, `MediaAsset`.
     - Run `npx prisma db push` or `prisma generate` to update client types without dropping existing tables (`Subscription`, `CertificateDownload`, `SystemLog`, etc.).
  2. **Seed Initial Production Records (`prisma/seed.ts`):**
     - Seed initial verified projects (KRA Portal, POS System, Vybe Africa, Daraja M-Pesa Gateway), skills, experiences, and site settings.
  3. **Universal Authorization Integration (`lib/admin-auth.ts`):**
     - Ensure all newly created `/api/admin/*` endpoints strictly enforce `verifyAdminCaller(req)`.
- **Verification:**
  - `npx prisma validate`
  - `npm run typecheck`

---

### Chunk 4: Core Content CMS (Projects, Skills, Services)
- **Objective:** Build dedicated administrative management screens within `/admin` for all core portfolio content.
- **Key Modules:**
  1. **Projects Manager (`app/admin/projects/page.tsx`, `app/admin/projects/new/page.tsx`, `app/admin/projects/[id]/page.tsx`):**
     - Project list with search, category filtering, publish status toggle, and delete confirmation.
     - Project editor supporting title, slug, summary, full description, problem statement, architecture solution, technology tags, live URLs, GitHub URLs, and display order.
  2. **Skills & Experience CMS (`app/admin/skills/page.tsx`, `app/admin/experience/page.tsx`):**
     - Manage skill categories, proficiency levels, work history, and certifications.
  3. **Services CMS (`app/admin/services/page.tsx`):**
     - Manage service offerings, descriptions, and feature lists.
- **Verification:**
  - CRUD operations tested via API and UI.

---

### Chunk 5: Articles & Publication Workflow
- **Objective:** Provide a rich content creation and publication workflow for technical articles.
- **Key Modules:**
  1. **Articles CMS (`app/admin/articles/page.tsx`, `app/admin/articles/[id]/page.tsx`):**
     - Article list with search, category filters, and draft/published indicators.
     - Markdown/Rich-text editor with live preview, word count, reading time calculator, and slug generator.
     - Scheduled publishing and unpublish functionality.
  2. **Public Article Integration (`app/articles/page.tsx`, `app/articles/[slug]/page.tsx`):**
     - Dynamic rendering of published articles from the database with syntax-highlighted code blocks and metadata.
- **Verification:**
  - Creating draft -> Verify not visible publicly.
  - Publishing article -> Verify instantly rendered at `/articles/[slug]`.

---

### Chunk 6: Contact CRM & Lead Management
- **Objective:** Convert contact submissions into a persistent CRM pipeline.
- **Key Modules:**
  1. **Public Submission Endpoint (`POST /api/inquiries`):**
     - Zod schema validation (name, email, phone, company, projectType, budget, message).
     - Rate limiting and IP tracking to prevent spam.
     - Persistent database storage in `inquiries` table.
  2. **Admin Inquiry CRM (`app/admin/inquiries/page.tsx`, `app/admin/inquiries/[id]/page.tsx`):**
     - Searchable, filterable list of leads by status (`New`, `Contacted`, `Qualified`, `Proposal Sent`, `Won`, `Lost`, `Archived`).
     - Detail view with lead information, internal notes thread (`inquiry_notes`), status updater, and follow-up reminders.
     - Export to CSV action for external reporting.
- **Verification:**
  - Submit form from `/contact` -> Verify new lead appears in `/admin/inquiries` with status `New`.

---

### Chunk 7: Dynamic SEO Manager & Analytics Integration
- **Objective:** Page-level SEO controls, social sharing metadata, dynamic XML sitemap, and real analytics display.
- **Key Modules:**
  1. **SEO Manager (`app/admin/seo/page.tsx`):**
     - Page-level meta title, description, keywords, canonical URLs, and Open Graph image configuration.
  2. **Dynamic XML Sitemap (`app/sitemap.ts`):**
     - Automatically indexes published projects, published articles, and core public routes while excluding private admin routes and drafts.
  3. **Analytics Dashboard (`app/admin/analytics/page.tsx`):**
     - Real visitor metrics, traffic by device, top viewed projects, and conversion rates derived from database sessions.
- **Verification:**
  - Inspect `curl http://localhost:3000/sitemap.xml` for valid XML formatting and published URLs.

---

### Chunk 8: Website Settings, Appearance & Security Hardening
- **Objective:** Centralized website appearance settings, audit logs, and security hardening.
- **Key Modules:**
  1. **Site Settings CMS (`app/admin/settings/page.tsx`):**
     - Configure website title, meta description, brand contact email, phone, location, social links, resume URL.
  2. **Audit Activity Logs (`app/admin/audit-logs/page.tsx`):**
     - Track all admin actions (create, edit, delete, publish, login) in `system_logs`.
  3. **Security Review:**
     - Sanitize inputs, enforce server-side validation, prevent XSS in article rendering.
- **Verification:**
  - Audit logging verification on every administrative action.

---

### Chunk 9: Quality Assurance, Verification & Production Deployment
- **Objective:** End-to-end regression testing, responsive checks, typecheck, production build, git commit, and deployment.
- **Key Modules:**
  1. **Automated Verification:**
     - `npx tsc --noEmit`
     - `npm run lint`
     - `npm run build`
  2. **Git Commit & Push:**
     - Conventional commit messages pushed to `main` for Vercel production deployment.
  3. **Final Report:**
     - Comprehensive completion report adhering to the master prompt's final reporting structure.
