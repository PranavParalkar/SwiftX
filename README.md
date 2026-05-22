# FinTech Wallet — Zero-fee Remittance

A mobile-first PWA that lets migrant workers send zero-fee remittances to family in India, hold balances in multiple currencies, receive AI-powered financial guidance, and access micro-investment products — built on a transparent, **SHA-256 hash-chained ledger** in Postgres.

**Hackathon Problem Statement 12** · 24-hour build · team of 4

The full implementation plan is in [`docs/implementation.md`](docs/implementation.md).

> **Scope decision:** the original plan mentioned optional Polygon anchoring. We dropped it (cut-list item #5) — the Postgres hash chain alone is the integrity story. Every transaction's SHA-256 links to the previous, the admin chain page can recompute and verify on demand, and a single broken hash proves tampering. No on-chain dependency, no testnet faucet to worry about during demo.

---

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 + manual shadcn/ui setup
- Supabase (Postgres + Auth + RLS) — single source of truth
- SHA-256 hash chain (Node `crypto`) computed in [`lib/chain.ts`](lib/chain.ts)
- Anthropic Claude API for AI insights
- next-intl for EN + Hindi

---

## First-run setup

```powershell
# 1. Env: copy template and fill in Supabase + Anthropic keys
copy .env.local.example .env.local

# 2. Push the schema to your Supabase project
#    Open Supabase SQL editor and paste supabase/migrations/001_initial_schema.sql
#    OR use the Supabase CLI:
#       supabase link --project-ref <ref>
#       supabase db push

# 3. (Optional) Seed demo data
#    npx tsx scripts/seed.ts

# 4. Run the dev server
npm run dev
```

Open <http://localhost:3000>.

---

## Team ownership (see `docs/implementation.md` section 6)

| Person | Owns |
|---|---|
| **P1** Backend | `supabase/`, `lib/transfer.ts`, `lib/chain.ts`, `lib/fx.ts`, `lib/aml.ts`, `app/api/transfer`, `app/api/fx`, `app/api/verify-chain` |
| **P2** Frontend | `app/(app)/`, `app/(auth)/`, `components/`, `lib/i18n/`, mobile-frame, PWA |
| **P3** AI + chain UX | `lib/ai.ts`, `app/api/insights`, admin chain verifier UI |
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
- `/compliance`, `/pools`, `/chain` — admin dashboards (chain = SHA-256 verifier)

---

## How the hash chain works

Every row in `transactions` has:

- `prev_hash` — `current_hash` of the previous row (or `'GENESIS'` for the first)
- `current_hash` — `SHA-256(id | from_wallet | to_wallet | from_amt | to_amt | fx_rate | created_at | prev_hash)`

The admin `/chain` page calls `GET /api/verify-chain`, which:

1. Reads every transaction in order
2. Recomputes each `current_hash` from the row's data
3. Checks each row's `prev_hash` matches the previous row's `current_hash`
4. Returns `{ valid: true }` or the exact `id` where the chain broke

Tampering with any historical row breaks the chain from that row onward — the verifier catches it instantly. No on-chain anchoring needed; the cryptographic primitive is the same one Bitcoin uses for block headers.

---

## What's wired vs stubbed

| Area | Status |
|---|---|
| Folder structure + all 17 route stubs | ✅ |
| Hash chain logic (`lib/chain.ts`) | ✅ real |
| AML rules (`lib/aml.ts`) | ✅ real |
| FX rate fetcher with cache + fallback (`lib/fx.ts`) | ✅ real, needs Supabase |
| Transfer business logic (`lib/transfer.ts`) | ✅ real, needs Supabase + RPC |
| Claude AI insight (`lib/ai.ts`) | ✅ real, needs `ANTHROPIC_API_KEY` |
| API routes (`/api/fx`, `/transfer`, `/insights`, `/verify-chain`) | ✅ all wired |
| SQL schema + RLS + `execute_transfer` RPC | ✅ migration ready |
| Auth (Supabase `signInWithOtp`) | ⏳ form is static — wire in `(auth)/login` |
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
5. ~~Polygon anchoring~~ — **already cut**, see scope note above
