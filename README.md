# SwiftX - FinTech Financial Inclusion Platform

SwiftX is a mobile-first financial inclusion platform for zero-fee remittances, multi-currency wallets, and AI-driven financial guidance aimed at migrant workers and underserved users. The demo focuses on instant wallet-to-wallet transfers, transparent FX, and a cryptographically verifiable ledger with optional Polygon anchoring.

## Problem
- Cross-border remittances are expensive and slow.
- Underserved users lack simple, trusted financial tools.
- Compliance and transparency are often opaque to end users.

## Solution Overview
- Zero-fee wallet-to-wallet remittances with transparent FX spread.
- Multi-currency balances with pooled liquidity and live FX conversion.
- AI-powered guidance tailored to the user’s transaction patterns.
- Hash-chained ledger for tamper-evident records, with optional Polygon anchoring.

## Core Demo Persona
- Sender: Ravi, a construction worker in Dubai (USD wallet).
- Recipient: Mother in Kerala (INR wallet).
- Story: Ravi sends INR 15,000 instantly with zero fees.

## Architecture Summary
- Frontend: Next.js 14 (App Router) + TypeScript
- Styling: Tailwind CSS + shadcn/ui
- Backend: Next.js API routes + Server Actions
- Database: Supabase Postgres with RLS
- Auth: Supabase Auth (magic link + phone OTP)
- FX: exchangerate.host API (cached hourly)
- AI: Anthropic Claude API
- Ledger: SHA-256 hash chain + Polygon Amoy anchoring
- Hosting: AWS

## Key Features
- Wallet-to-wallet transfers with live FX conversion.
- Hash chain verification for every transaction.
- Admin compliance dashboard with AML flags.
- Multilingual UI (English + Hindi).
- PWA for mobile-first installation.

## Data and Compliance Highlights
- Core tables: profiles, wallets, transactions, fx_rates_cache, aml_flags, polygon_anchors.
- Row Level Security ensures users only see their own data.
- AML checks run on transfers with audit trail records.

## Project Structure
- app/: routes and API endpoints
- components/: UI components and widgets
- lib/: core business logic (FX, transfer, chain, AI)
- contracts/: Polygon anchoring contract
- scripts/: seed data and contract deployment
- public/: PWA manifest, icons, and locales

## Demo Flow (3 minutes)
1. Open app via QR code.
2. Login as Ravi.
3. Switch language to Hindi.
4. Tap Send home.
5. Enter INR 15,000 for mother.
6. Review FX breakdown (rate, fee, amount received).
7. Confirm transfer.
8. View hash chain receipt and PolygonScan link.
9. Show AI insight card.
10. Open micro-investment screen.
11. Switch to admin view.

## Revenue Model
- Transparent FX spread (0.5% to 1%).
- Float interest on pooled balances.
- Premium features.

## Team Allocation
- P1: Backend (DB, RLS, transfer RPC, hash chain, AML, FX caching).
- P2: Frontend (UI screens, PWA, i18n, navigation).
- P3: AI and blockchain (Claude integration, Solidity contract, anchoring cron).
- P4: Design and pitch (visuals, demo data, deck, README).

## Timeline (24 Hours)
- Hour 0-1: Setup and alignment.
- Hour 1-6: Parallel foundation.
- Hour 6-12: End-to-end transfer working.
- Hour 12-16: AI insights and live FX.
- Hour 16-20: Compliance and deep features.
- Hour 20-22: Polish and deploy.
- Hour 22-24: Demo prep and rehearsal.

## Risks and Mitigations
- RLS misconfig: test with two accounts early.
- Polygon anchor failure: get faucet funds early.
- FX API limits: cache and fallback rate.
- Demo failure: backup video and real-device testing.

## Setup (Hour 0)
```bash
npx create-next-app@latest fintech-wallet --typescript --tailwind --app
cd fintech-wallet

npm install @supabase/supabase-js @supabase/ssr
npm install @anthropic-ai/sdk
npm install ethers
npx shadcn@latest init
npx shadcn@latest add button input card dialog form toast

npm install next-pwa
npm install next-intl
```

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
POLYGON_AMOY_RPC=https://rpc-amoy.polygon.technology
POLYGON_PRIVATE_KEY=
LEDGER_ANCHOR_CONTRACT=
```

## Success Criteria
- Demo URL works on mobile via QR code.
- Full transfer flow under 30 seconds.
- FX breakdown shows live rate and margin.
- Polygon anchor visible on PolygonScan.
- AI insight generated in user language.
- Admin dashboard shows compliance metadata.
