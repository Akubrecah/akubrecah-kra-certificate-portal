# Akubrecah Technologies — Transformation Plan
**Slug:** `software-engineering-transformation`
**Status:** In Progress
**Agent:** `@orchestrator` / `@frontend-specialist`

## 1. Executive Summary
Transform Akubrecah into a full-scale modern software engineering & development company (Web, Mobile, Cloud, Enterprise) while preserving existing features (KRA Certificate Retrieval, Live PIN Checker, Tax Returns Filing) as flagship in-house products and client solutions. Replace the sidebar with a high-performance top header navigation and completely decommission the CV builder.

## 2. Requirements & Discovery Alignments
- **Brand Identity:** Akubrecah Technologies — Full-stack software engineering firm.
- **Navigation Architecture:** Move all navigation from the collapsible/resizable sidebar to the top `SiteHeader` with responsive dropdown menus (Services, Products & Tools, Company, Dashboard) and full mobile drawer. Content area expands to full-width across all screen sizes.
- **CV Builder Removal:** Purge CV builder components, `/dashboard/cv-builder` page (redirecting gracefully to `/dashboard`), API route `/api/ai/generate-cv`, and references.
- **In-House Tools Preservation:** KRA Retrieval Portal (`/retrieval-portal`), Live PIN Checker (`/pin-checker`), and Tax Filing (`/dashboard/filing`) remain fully operational, secured via auth as configured, and highlighted as flagship engineering solutions.
- **Client & Engineering Dashboard:** Modernized into an executive client portal with quick access to engineering consultations, active project overview, and built-in automation utilities.

## 3. Vertical Implementation Slices
- [ ] **Slice 1: CV Builder Purge & Graceful Routing**
  - Delete or redirect `/app/dashboard/cv-builder/page.tsx`
  - Remove `/app/api/ai/generate-cv/route.ts`
  - Clean up CV references in dashboard and types
- [ ] **Slice 2: Header Navigation & Sidebar Decommissioning**
  - Refactor `components/admin-layout-wrapper.tsx` to remove the left sidebar, resizer HUD, and margin offsets; make content container clean and full-width
  - Upgrade `components/site-header.tsx` with rich desktop dropdowns (Services, Products & Tools, Company), mobile slide drawer, role badges, and auth actions
- [ ] **Slice 3: Homepage Rebranding & Software Engineering Showcase**
  - Overhaul `app/page.tsx` to present Akubrecah as an elite software engineering company (Web, Mobile, Cloud, Custom Software, Enterprise)
  - Showcase the KRA Retrieval Suite as a live in-house GovTech product highlight
  - Add Engineering Capabilities, Tech Stack, Process, and Project Inquiry sections
- [ ] **Slice 4: Client & Engineering Dashboard Modernization**
  - Update `app/dashboard/page.tsx` with project consultation launcher, in-house tools hub, and activity logs
- [ ] **Slice 5: Verification & Quality Assurance**
  - Run type checks (`npm run typecheck` or Next.js build validation)
  - Verify layout responsiveness and clean lint status
