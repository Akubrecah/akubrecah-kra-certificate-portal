# CI/CD Pipeline Documentation

This repository implements an enterprise-grade, automated CI/CD pipeline built with **GitHub Actions**, **Vercel**, and **Evolution API / WhatsApp Alerts**.

---

## 1. Pipeline Overview

```
                                 ┌──────────────────────────────────────────────┐
                                 │                DEVELOPER                     │
                                 └──────────────────────┬───────────────────────┘
                                                        │
                         ┌──────────────────────────────┴──────────────────────────────┐
                         ▼                                                             ▼
             [ Pull Request to main ]                                        [ Direct Push to main ]
                         │                                                             │
                         ▼                                                             ▼
        ┌──────────────────────────────────┐                         ┌──────────────────────────────────┐
        │        Workflow: ci.yml          │                         │       Workflow: deploy.yml       │
        ├──────────────────────────────────┤                         ├──────────────────────────────────┤
        │ 1. 🛡️ Quality Gate:             │                         │ 1. 🛡️ Quality Gate:             │
        │    - Prisma schema validate      │                         │    - Prisma schema validate      │
        │    - Prisma client generate      │                         │    - Prisma client generate      │
        │    - ESLint analysis (0 errors)  │                         │    - ESLint analysis (0 errors)  │
        │    - TypeScript typecheck        │                         │    - TypeScript typecheck        │
        │    - Next.js production build    │                         │    - Next.js production build    │
        │                                  │                         │                                  │
        │ 2. 🔒 Security Audit:            │                         │ 2. 🚀 Vercel Production Deploy   │
        │    - Gitleaks secret detection   │                         │    - Pull production env         │
        │    - npm dependency audit        │                         │    - Build production bundle     │
        │                                  │                         │    - Deploy --prod to live       │
        │ 3. 🚀 Vercel Preview Deployment: │                         │                                  │
        │    - Pre-built ephemeral preview │                         │ 3. 📢 WhatsApp Release Alert:    │
        │    - Automatic PR comment link   │                         │    - Send dispatch text to admin │
        │                                  │                         │      via Evolution API / Webhook │
        │ 4. 📢 Pipeline Status Alert:     │                         └──────────────────────────────────┘
        │    - WhatsApp alert on PR status │
        └──────────────────────────────────┘
```

---

## 2. GitHub Secrets Configuration

To connect GitHub Actions with your Vercel deployment and WhatsApp notification bot, add the following secrets in your repository settings:

👉 **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Description | Example / Current Value |
|-------------|-------------|-------------------------|
| `VERCEL_TOKEN` | Vercel Personal Access Token (from [Vercel Tokens](https://vercel.com/account/tokens)) | `AbCdEf123456...` |
| `VERCEL_ORG_ID` | Vercel Team / Org ID | `team_vmAKoPs7Zz3mGe6LEUj5WiIs` |
| `VERCEL_PROJECT_ID` | Vercel Project ID | `prj_qP2jRgwrMsICqRlBPqMsvdkcRyRe` |
| `DATABASE_URL` | Production PostgreSQL pooled connection URL | `postgresql://postgres:...@...supabase.co:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Production PostgreSQL direct connection URL | `postgresql://postgres:...@...supabase.co:5432/postgres` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Auth Publishable Key | `pk_live_...` |
| `CLERK_SECRET_KEY` | Clerk Auth Secret Key | `sk_live_...` |
| `EVOLUTION_API_URL` | Evolution API server URL | `http://169.58.96.131:8085` |
| `EVOLUTION_API_KEY` | Evolution API access token | `akubrecah_secret_whatsapp_key_2026` |
| `ADMIN_WHATSAPP_PHONE` | Admin mobile number to receive alerts | `254791497858` |
| `WHATSAPP_NOTIFICATION_WEBHOOK` | (Optional) Generic webhook endpoint for Discord/Slack/n8n | `https://n8n.vybeafrica.org/webhook/...` |

---

## 3. Local Verification Suite

Run the exact checks that GitHub Actions enforces before pushing code:

```bash
# 1. Prisma schema validation
npm run prisma:validate

# 2. Strict ESLint analysis
npm run lint -- --quiet

# 3. TypeScript typecheck
npm run typecheck

# 4. Production build verification
npm run build
```

---

## 4. Recommended Branch Protection Rules

To guarantee zero broken builds in production:
1. Go to **Settings** → **Branches** → **Add branch protection rule**.
2. Branch name pattern: `main`.
3. Check **Require a pull request before merging**.
4. Check **Require status checks to pass before merging**:
   - Select `🛡️ Quality Gate (Lint, Types, Schema & Build)`.
   - Select `🔒 Security & Secret Governance`.
5. Check **Require branches to be up to date before merging**.
