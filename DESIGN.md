---
version: 1.0.0
name: GovTech Prestige
description: "Single source of truth design system for Akubrecah KRA compliance portal, cyber cafe subscription hub, and instant certificate retrieval engine."
colors:
  primary: "#BA1A1A"
  primary-hover: "#9C1414"
  primary-muted: "#FDE8E8"
  primary-container: "#FFDAD6"
  on-primary: "#FFFFFF"
  on-primary-container: "#410002"
  surface: "#FDFDFD"
  surface-card: "#FFFFFF"
  surface-card-subtle: "#F8FAFC"
  surface-dark: "#0F172A"
  surface-dark-card: "#1E293B"
  neutral: "#0F172A"
  neutral-muted: "#475569"
  neutral-subtle: "#94A3B8"
  border: "#E2E8F0"
  border-dark: "#334155"
  success: "#16A34A"
  success-bg: "#DCFCE7"
  warning: "#D97706"
  warning-bg: "#FEF3C7"
  error: "#DC2626"
  error-bg: "#FEE2E2"
typography:
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  headline-xl: { fontSize: "36px", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.03em" }
  headline-lg: { fontSize: "28px", fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.025em" }
  headline-md: { fontSize: "20px", fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.02em" }
  body-lg: { fontSize: "16px", fontWeight: 500, lineHeight: 1.5 }
  body-md: { fontSize: "14px", fontWeight: 400, lineHeight: 1.5 }
  body-sm: { fontSize: "12px", fontWeight: 400, lineHeight: 1.4 }
  label-md: { fontSize: "12px", fontWeight: 700, letterSpacing: "0.04em" }
  label-sm: { fontSize: "11px", fontWeight: 600, letterSpacing: "0.02em" }
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  card:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.xl}"
    border: "1px solid {colors.border}"
  input:
    rounded: "{rounded.md}"
    border: "1px solid {colors.border}"
    height: "44px"
    fontSize: "14px"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
    height: "44px"
---

# GovTech Prestige Design Specification

## Overview
Akubrecah KRA is an official government automation and tax compliance platform engineered for Kenyan citizens, businesses, and cyber cafe professionals.
The design ethos blends institutional trust, surgical precision, and lightning-fast ergonomics.
Every element is designed to convert instantly without cognitive friction, eliminating unnecessary scrolling and presenting critical actions immediately above the fold.

## Colors
- **Primary Sovereign Red (`#BA1A1A` / `#DC2626`)**: Inspires authoritative compliance and legal certainty matching Kenyan statutory themes.
- **Strict Purple Ban**: Violet, indigo, and purple hues are categorically banned to avoid generic SaaS tropes and protect institutional trust.
- **High-Contrast Neutral Surface (`#0F172A` / `#1E293B` on dark, `#FFFFFF` / `#F8FAFC` on light)**: Eliminates text-background bleeding; ensures all labels and values are 100% legible under all lighting conditions (WCAG AAA rating).
- **Emerald Verification (`#16A34A` / `#DCFCE7`)**: Used strictly for confirmed statutory registrations and active subscriber credentials.

## Typography
- Primary Font: **Inter**, fallback to modern system sans.
- Strictly no faint, washed-out, or hidden typography. Secondary labels maintain a minimum 4.5:1 contrast ratio against card backgrounds.
- High-impact data badges use mono and tabular numeric figures for dates, KRA PINs, and M-Pesa transaction reference codes.

## Layout & Above-the-Fold Architecture
- **Split Hero Architecture**:
  - Desktop: Left column (45%) presents institutional verification signals, live service telemetry, and cyber subscription status. Right column (55%) embeds the interactive retrieval engine immediately above the fold with zero scroll requirement.
  - Mobile: Ultra-compact header strip (<100px) transitioning immediately into the National ID / PIN input card.
- **Zero Scroll Mandate**: The core job-to-be-done (entering National ID or KRA PIN and getting the certificate) is achieved within the initial viewport.

## Elevation & Depth
- Flat, tactile, layered surfaces with razor-thin borders (`border-slate-200 dark:border-slate-800`).
- Ambient backlights use subtle 5% red radial gradients rather than distracting saturated glow effects.

## Shapes
- Cards use modern 24px (`rounded-3xl`) outer frames and 16px (`rounded-2xl`) internal subcards.
- Interactive form controls use tactile 10px–12px border radii with distinct 2px focus rings (`ring-2 ring-primary/30`).

## Components
### 1. Form Filling System
- **Dual-Mode Selector Tabs**: Crisp segmented toggle (National ID vs KRA PIN) with immediate active feedback.
- **High-Contrast Input Fields**: 44px–48px touch targets with prominent leading icons and uppercase formatting for PIN entries.
- **Tactile Arithmetic CAPTCHA**: Isolated challenge box with instant 1-click refresh button and high-contrast numerical answer input.
- **Manual Data Review**: Clean 2-column key-value grid for taxpayer station, registration date, county, and tax obligations with unmasked / masked indicators.

### 2. Multi-Stage Animated Loading Engine
- Replaces generic spinners with a progressive 3-stage statutory verification HUD:
  1. *Stage 1*: Connecting to Government Statutory Gateway
  2. *Stage 2*: Scanning National Taxpayer Registry & Resolving PIN
  3. *Stage 3*: Generating Tamper-Proof Cryptographic PDF & QR Code
- Visual radar scanner effect with pulsing concentric rings and live animated progress bar.

### 3. Logged-In Cyber Cafe Subscription Module
- **Active Subscription State**:
  - Live status badge: "☕ Cyber Cafe Plan Active"
  - Prominent countdown badge: "📅 Days Remaining: X days"
  - Instant Zero-Fee Download button (KES 0 bypass)
  - Quick action: "📄 View / Re-download Fiscal Invoice"
- **Unsubscribed Logged-In State**:
  - Highlighting KES 500/month unlimited plan benefits
  - 1-click "Activate Monthly Unlimited" opening M-Pesa STK push and Card modal

## Do's and Don'ts
- **DO** present the interactive form immediately in the viewport without requiring user scroll.
- **DO** verify that all text colors have strong, high-contrast visibility against their parents.
- **DON'T** use purple, violet, or lavender gradients anywhere.
- **DON'T** use giant, empty hero sections with 200px+ of dead space that push forms below the fold.
- **DON'T** obscure user inputs or CAPTCHAs with transparent overlays or low-contrast borders.
