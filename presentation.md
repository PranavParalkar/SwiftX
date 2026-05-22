# SwiftX - FinTech Financial Inclusion Platform

## 1. Title and One-line Pitch
- Product: SwiftX
- One-line pitch: Wise's transparent FX model and M-Pesa's inclusion approach, built for India's regulatory framework, with AI-powered financial guidance for the underbanked.

## 2. Problem
- 250M migrant workers send remittances.
- Average fees around 6.2% and slow settlement.
- Unbanked and underbanked users lack simple, trusted tools.

## 3. Solution
- Zero-fee remittances via wallet-to-wallet transfers.
- Multi-currency balances for senders and recipients.
- AI-powered guidance for savings and investments.
- Trust via hash-chained ledger with optional Polygon anchoring.

## 4. Core Demo Persona and Story
- Sender: Ravi, construction worker in Dubai (USD balance).
- Recipient: Mother in Kerala (INR balance).
- Story: Ravi sends INR 15,000; funds arrive instantly with zero fees.

## 5. Product Overview
- Mobile-first PWA, optimized for low-tech users.
- Multilingual UI (English + Hindi).
- KYC and compliance built in (AML and audit trails).

## 6. Architecture Overview
### Stack
- Frontend: Next.js 14 (App Router) + TypeScript
- Styling: Tailwind CSS + shadcn/ui
- Backend: Next.js API routes + Server Actions
- Database: Supabase Postgres + RLS
- Auth: Supabase Auth (magic link + phone OTP)
- FX Rates: exchangerate.host API (cached hourly)
- AI Insights: Anthropic Claude API
- Ledger: SHA-256 hash chain + Polygon Amoy anchoring
- Hosting: AWS
- i18n: next-intl or i18next
- Voice (optional): Web Speech API

### High-level Flow
- User tops up wallet (mocked for demo).
- Sender initiates transfer.
- Ledger debits sender wallet and credits recipient wallet at live FX rate.
- Transaction hashed and linked to previous hash.
- Periodic anchor to Polygon for public verification.

## 7. Why This Works
- Zero-fee transfers: internal ledger settlement avoids per-transaction bank fees.
- Multi-currency pools: bulk rebalancing instead of per-transfer FX.
- Hash chain: cryptographic immutability without public chain latency.
- Polygon anchoring: public verifiability with low operational cost.

## 8. Database Schema (Highlights)
- profiles: user metadata and KYC status.
- wallets: per-user, per-currency balances.
- transactions: ledger entries with hash chaining.
- fx_rates_cache: hourly FX cache.
- aml_flags: compliance audit trail.
- polygon_anchors: batch anchoring records.

## 9. Core Logic (Highlights)
- Hash chain: compute and verify per transaction.
- FX rates: cached with a small FX spread for revenue.
- Transfer: atomic balance updates with AML checks.
- AI insights: personalized tips based on recent transactions.
- Polygon anchor: batch ledger hashes for public auditability.

## 10. Demo Walkthrough (3 minutes)
1. Open app via QR code.
2. Login as Ravi.
3. Switch to Hindi.
4. Tap "Send home".
5. Enter INR 15,000 for mother.
6. FX breakdown screen shows:
   - You pay: $180.65
   - Rate: 1 USD = 83.20 INR
   - Fee: $0.00
   - She receives: INR 15,000
   - Arrives: Instant
7. Confirm transfer.
8. View hash chain receipt with PolygonScan link.
9. Show AI insight card.
10. Open micro-investment screen.
11. Switch to admin view (compliance + pools).

## 11. Revenue Model
- Transparent FX spread (0.5% to 1%).
- Float interest on pooled balances.
- Premium features.

## 12. Compliance and Risk
- KYC/AML built into flows.
- RLS prevents data leakage between users.
- AML flags and admin dashboard for audits.

## 13. Team Allocation
- P1: Backend (DB, RLS, transfer, hash chain, AML, FX caching).
- P2: Frontend (UI screens, PWA, i18n, nav).
- P3: AI and blockchain (Claude, Solidity, anchoring cron).
- P4: Design and pitch (visuals, demo data, deck, README).

## 14. Timeline (24 Hours)
- Hour 0-1: Setup and alignment.
- Hour 1-6: Parallel foundation.
- Hour 6-12: End-to-end transfer working.
- Hour 12-16: AI insights and FX live rates.
- Hour 16-20: Compliance and deep features.
- Hour 20-22: Polish and deploy.
- Hour 22-24: Demo prep and rehearsal.

## 15. Risks and Mitigations
- RLS misconfig: test with two accounts early.
- Polygon anchor failure: get faucet funds early.
- FX API limits: cache and fallback.
- Demo failure: backup video and real-device testing.

## 16. Success Criteria
- Demo URL works on mobile via QR.
- Transfer flow under 30 seconds.
- FX breakdown shows live rates and margin.
- Polygon anchor visible on PolygonScan.
- AI insight generated in user language.
- Admin dashboard reflects compliance metadata.

## 17. Closing
- SwiftX delivers zero-fee remittances with transparent trust and real-world compliance.
- The platform targets migrant workers with a simple, mobile-first experience and AI-powered financial guidance.
