# FinTech Wallet — Zero-fee Remittance

A mobile-first PWA that lets migrant workers send zero-fee remittances to family in India, hold balances in multiple currencies, receive AI-powered financial guidance, and access micro-investment products — built on a transparent, hash-chained ledger with optional Polygon anchoring.

**Hackathon Problem Statement 12** · 24-hour build · team of 4

The full implementation plan is in [`docs/implementation.md`](docs/implementation.md).

---

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 + manual shadcn/ui setup
- Supabase (Postgres + Auth + RLS)
- Anthropic Claude API for AI insights
- ethers.js + Polygon Amoy for ledger anchoring
- next-intl for EN + Hindi

---

## First-run setup

```powershell
# 1. Copy the env template and fill in real values
copy .env.local.example .env.local

# 2. Push the schema to your Supabase project
#    Open Supabase SQL editor and paste supabase/migrations/001_initial_schema.sql
#    OR use the Supabase CLI:
#       supabase link --project-ref <ref>
#       supabase db push

# 3. Deploy the Polygon contract
#    Open contracts/LedgerAnchor.sol in Remix, deploy to Polygon Amoy.
#    Paste the contract address into LEDGER_ANCHOR_CONTRACT in .env.local.

# 4. (Optional) Seed demo data
#    npx tsx scripts/seed.ts

# 5. Run the dev server
npm run dev
```

Open <http://localhost:3000>.

---

## Team ownership (see `docs/implementation.md` section 6)

| Person | Owns |
|---|---|
| **P1** Backend | `supabase/`, `lib/transfer.ts`, `lib/chain.ts`, `lib/fx.ts`, `lib/aml.ts`, `app/api/transfer`, `app/api/fx` |
| **P2** Frontend | `app/(app)/`, `app/(auth)/`, `components/`, `lib/i18n/`, mobile-frame, PWA |
| **P3** AI + chain | `lib/ai.ts`, `lib/polygon.ts`, `contracts/`, `app/api/insights`, `app/api/anchor` |
| **P4** Design + pitch | UI polish, `scripts/seed.ts`, demo deck, README, demo video |

**Rule:** one person, one ownership area. P4 helps wherever needed once design system is locked.

---

## Key routes

- `/` — landing (redirects to `/home` if signed in)
- `/login`, `/signup` — auth flows (magic link / phone OTP — wire to Supabase)
- `/home` — wallet balance dashboard
- `/send` → `/send/confirm` — the demo hero (FX breakdown)
- `/history`, `/history/[id]` — tx list + hash chain receipt
- `/insights` — AI insight cards
- `/invest` — round-up jar + SIP starter
- `/kyc`, `/settings` — onboarding + account
- `/compliance`, `/pools`, `/chain` — admin dashboards

---

## What's wired vs stubbed

| Area | Status |
|---|---|
| Folder structure + all 18 route stubs | ✅ |
| Hash chain logic (`lib/chain.ts`) | ✅ real implementation |
| AML rules (`lib/aml.ts`) | ✅ real rules |
| FX rate fetcher with cache + fallback (`lib/fx.ts`) | ✅ real, needs Supabase |
| Transfer business logic (`lib/transfer.ts`) | ✅ real, needs Supabase + RPC |
| Polygon anchoring (`lib/polygon.ts`) | ✅ real, needs deployed contract |
| Claude AI insight (`lib/ai.ts`) | ✅ real, needs ANTHROPIC_API_KEY |
| API routes (`/api/*`) | ✅ all wired |
| SQL schema + RLS + execute_transfer RPC | ✅ migration ready |
| Solidity contract | ✅ ready to deploy |
| Auth (Supabase signInWithOtp) | ⏳ form is static — wire in `(auth)/login` |
| Demo data seed script | ⏳ skeleton only |
| Hindi translation strings | ⏳ |
| Webcam KYC selfie | ⏳ |
| PWA service worker | ⏳ (manifest done; SW deferred to hour 20) |

---

## Cut list (drop in this order if behind)

1. Voice command via Web Speech API
2. Second language fully wired
3. Webcam KYC selfie (use file upload)
4. Round-up jar animation
5. Polygon anchoring (keep hash chain only)

**Never cut:** end-to-end transfer flow, FX breakdown screen, AI insight, KYC mock, admin dashboard.
