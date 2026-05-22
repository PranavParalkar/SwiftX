# SwiftX - FinTech Financial Inclusion Platform

SwiftX is a mobile-first financial inclusion platform focused on zero-fee remittances, multi-currency wallets, and AI-driven financial guidance for migrant workers and underserved users. The demo showcases instant wallet-to-wallet transfers, transparent FX, and a cryptographically verifiable ledger with optional Polygon anchoring.

## Highlights
- Zero-fee remittances with transparent FX spread
- Multi-currency wallets (USD, INR, AED)
- AI-powered financial insights
- Hash-chained ledger with optional Polygon anchoring
- Built-in compliance with KYC/AML flows

## Core Demo Persona
- Sender: Ravi, a construction worker in Dubai (USD wallet)
- Recipient: Mother in Kerala (INR wallet)
- Story: Ravi sends INR 15,000 instantly with zero fees

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
- Wallet-to-wallet transfers with live FX conversion
- Hash chain verification for every transaction
- Admin compliance dashboard and AML flags
- Multilingual UI (English + Hindi)
- PWA for mobile-first installation

## Project Structure
- app/: routes and API endpoints
- components/: UI components and widgets
- lib/: core business logic (FX, transfer, chain, AI)
- contracts/: Polygon anchoring contract
- scripts/: seed data and contract deployment
- public/: PWA manifest, icons, and locales

## Demo Flow (3 minutes)
1. Open app via QR code
2. Login as Ravi
3. Switch language to Hindi
4. Tap Send home
5. Enter INR 15,000 for mother
6. Review FX breakdown (rate, fee, amount received)
7. Confirm transfer
8. View hash chain receipt and PolygonScan link
9. Show AI insight card
10. Open micro-investment screen
11. Switch to admin view

## Revenue Model
- Transparent FX spread (0.5% to 1%)
- Float interest on pooled balances
- Premium features

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
- Demo URL works on mobile via QR code
- Full transfer flow under 30 seconds
- FX breakdown shows live rate and margin
- Polygon anchor visible on PolygonScan
- AI insight generated in user language
- Admin dashboard shows compliance metadata
