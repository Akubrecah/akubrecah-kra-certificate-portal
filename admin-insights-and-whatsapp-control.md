# Task Plan: Admin Executive Dashboard, Transaction Logs, User/PC Insights & WhatsApp Bot Admin Integration

> **Status:** APPROVED & IN PROGRESS  
> **Target:** Akubrecah KRA Certificate Portal  
> **Primary Agents:** `orchestrator`, `frontend-specialist`, `backend-specialist`, `security-auditor`  
> **Skills:** `clean-code`, `frontend-design`, `react-best-practices`, `api-patterns`, `database-design`

---

## 1. Executive Summary & PRD

The Akubrecah KRA Certificate Portal is experiencing traffic across web and WhatsApp channels. The business requires full observability and management capabilities:
1. **Executive Overview Dashboard at `/admin`**:
   - Total & Today's Revenue (KES)
   - Real-time Transaction volume & STK/Payment success rate
   - Device distribution: PC (Desktop) vs Mobile vs Tablet usage
   - User engagement funnel (Searches → Masked views → Payment clicks → Download completed)
   - WhatsApp Bot adoption (Unique bot users, conversations, queries, bot-driven revenue)
2. **Unified Transaction Logs**:
   - Comprehensive audit log of every download & payment (M-Pesa STK push, Paystack card/bank, Subscription, Pay-per-download)
   - Customer identifiers, receipts, timestamps, statuses, search, and CSV export
3. **Client Analytics & Session Activity Tracking**:
   - Lightweight, privacy-conscious beacon endpoint (`/api/analytics/track`)
   - Records device category (PC / Mobile / Tablet), browser, OS, and key funnel events
4. **WhatsApp Bot Admin Control System**:
   - Super admin authentication via whitelisted admin numbers (`ADMIN_WHATSAPP_NUMBERS`) + secure admin PIN (`ADMIN_BOT_PIN`)
   - On-demand admin commands via WhatsApp:
     - `!admin` or `!help` — Admin command menu
     - `!stats` — Executive KPI summary (Users, PC vs Mobile, Downloads)
     - `!revenue` — Revenue report (Today, 7 days, 30 days, M-Pesa vs Paystack)
     - `!logs` — Latest 5 transactions with receipts and amounts
     - `!link` — Signed, time-limited 1-click magic link to the web admin dashboard

---

## 2. Tech Stack & Architectural Blueprint

```mermaid
graph TD
    subgraph Web Clients
        Browser[User Browser (PC/Mobile)]
        AdminUser[Admin on Web]
    end

    subgraph WhatsApp Surface
        WaUser[Standard WhatsApp User]
        WaAdmin[Authorized Super Admin]
        EvolutionAPI[Evolution API Webhook]
    end

    subgraph Backend & APIs
        AnalyticsAPI["/api/analytics/track"]
        AdminOverviewAPI["/api/admin/overview"]
        WaChatRoute["/api/whatsapp/chat"]
        MagicAuth["/api/admin/magic-login"]
    end

    subgraph Database Neon Postgres
        Prisma[(Prisma ORM)]
        SessionsTable[sessions & session_activities]
        CertDownloads[certificate_downloads]
        AiConversations[ai_conversations]
        UsersTable[users & subscriptions]
        SystemLogs[system_logs]
    end

    Browser -->|Beacon / Click events| AnalyticsAPI
    AnalyticsAPI --> Prisma
    Prisma --> SessionsTable

    AdminUser -->|View Dashboard| AdminOverviewAPI
    AdminOverviewAPI --> Prisma
    Prisma --> CertDownloads
    Prisma --> SessionsTable
    Prisma --> AiConversations

    WaUser --> EvolutionAPI
    WaAdmin --> EvolutionAPI
    EvolutionAPI --> WaChatRoute
    WaChatRoute -->|Check Admin Whitelist + PIN| WaChatRoute
    WaChatRoute -->|!stats, !revenue, !logs| Prisma
    WaChatRoute -->|Generate Magic Token| MagicAuth
```

---

## 3. UI/UX Design System Compliance (KRA Red - Zero Purple)

- **Primary Color:** KRA Red (`hsl(358 70% 37%)` / `#b2292a`)
- **Backgrounds:** `surface-container-lowest` (`#ffffff`), `surface-container` (`#ffe9e7`), Dark slate accent cards
- **Strict Prohibition:** NO PURPLE, NO VIOLET, NO INDIGO, NO MAGENTA.
- **Typography:** Inter / Geist Sans with crisp tabular numerals for financial data.
- **Components:** High-density executive cards with micro-trends, SVG progress rings / bars, status pill tags, and responsive tables.

---

## 4. Vertical Slices & Task Breakdown

### Slice 1: Database & Analytics Ingestion Layer
- [ ] Implement `/api/analytics/track` API route for collecting page views, device type (PC vs Mobile vs Tablet), and user click events (`search_pin`, `view_masked`, `click_stk_mpesa`, `click_paystack`, `download_certificate`).
- [ ] Connect client tracker utility in the frontend portal (`lib/analytics.ts`).

### Slice 2: Admin Overview & Analytics Data Engine
- [ ] Implement `/api/admin/overview` API route aggregating:
  - Financial Metrics: Total revenue, today's revenue, weekly/monthly revenue, breakdown by M-Pesa vs Paystack, Web vs WhatsApp.
  - PC Usage & Device Metrics: Desktop/PC count & %, Mobile count & %, browser stats.
  - User Click & Funnel Insights: Step conversion rates from prospective sessions to completed downloads.
  - WhatsApp Bot Statistics: Total unique numbers, conversation counts, conversion rates.
  - Real-Time Transaction Logs: Paginated query on `certificate_downloads` with user metadata, receipts, and filters.

### Slice 3: Executive Admin Dashboard UI (`app/admin/page.tsx`)
- [ ] Replace redirect in `app/admin/page.tsx` with full-featured Executive Overview Dashboard:
  - KPI Stat Cards with trend indicators (Revenue, Transactions, PC Usage, WhatsApp Bot Users)
  - Interactive Device Usage breakdown (PC vs Mobile vs Tablet)
  - Conversion Funnel visualization (Search → Masked Preview → Payment → Certificate Delivery)
  - WhatsApp Bot Insights Widget
  - Comprehensive Live Transaction Logs Table with search, gateway filter, and CSV download
- [ ] Update `app/admin/layout.tsx` sidebar with "Executive Overview" at the top.

### Slice 4: WhatsApp Bot Admin Management Integration
- [ ] Add Admin Phone whitelisting & PIN authentication state to `app/api/whatsapp/chat/route.ts`.
- [ ] Implement commands:
  - `!admin` / `!help`: Admin menu
  - `!stats`: Live system summary
  - `!revenue`: Financial breakdown
  - `!logs`: Recent transactions
  - `!link`: One-click signed magic URL for seamless mobile browser login
- [ ] Implement `/api/admin/magic-login` verification handler for one-click admin tokens.

### Slice 5: Verification, Typechecks & Quality Assurance
- [ ] Run `npm run typecheck` or Next.js build verification to ensure zero type errors.
- [ ] Verify security: Ensure admin API endpoints require proper authentication (`verifyAdminCaller`).
- [ ] Validate responsive layouts on Mobile (375px), Tablet (768px), and Desktop (1440px).
