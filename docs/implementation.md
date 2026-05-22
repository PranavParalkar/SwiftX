# FinTech Financial Inclusion Platform — Implementation Plan

**Problem Statement 12** · Hackathon Build · 24 hours · Team of 4

---

## 1. Project Summary

A mobile-first responsive web app (PWA) that lets migrant workers send zero-fee remittances to family in India, hold balances in multiple currencies, receive AI-powered financial guidance, and access micro-investment products — all built on a transparent, hash-chained ledger with optional Polygon anchoring for public verifiability.

**Core demo persona:** Ravi, a construction worker in Dubai (holds USD), sending money to his mother in Kerala (receives INR).

**One-line pitch:** *"Wise's transparent FX model and M-Pesa's inclusion approach, built for India's regulatory framework, with AI-powered financial guidance for the underbanked."*

---

## 2. Architecture Overview

### 2.1 Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | Server components, fast iteration, mobile-first |
| Styling | Tailwind CSS + shadcn/ui | Production-looking components in minutes |
| Mobile feel | PWA via `next-pwa` + `max-w-md` viewport | Installable, looks native on phone |
| Backend | Next.js API routes + Server Actions | Single codebase, no separate server |
| Database | Supabase (Postgres) | Auth + DB + realtime + storage in one |
| Auth | Supabase Auth (magic link + phone OTP) | Zero boilerplate |
| FX rates | exchangerate.host API | Free, no key, cached server-side |
| AI insights | Anthropic Claude API | Personalized, multilingual |
| "Blockchain" | SHA-256 hash-chained ledger + Polygon Amoy anchoring | Real cryptographic immutability + public verifiability |
| Hosting | AWS | One-command deploy, instant rebuilds |
| Internationalization | next-intl or i18next | EN + Hindi (cut: more languages) |
| Voice | Web Speech API (browser-native) | Free, no setup |

### 2.2 High-level flow

```
Foreign user (USD/AED) 
    → tops up wallet via local rail (mocked for demo)
    → USD balance in their wallet
    → initiates send to India recipient
    → ledger debits USD wallet, credits INR wallet at live FX rate
    → SHA-256 hash chain records the transaction
    → every N transactions, root hash anchored to Polygon Amoy
    → recipient sees INR balance update in realtime
    → recipient withdraws via UPI/IMPS (mocked for demo)
```

### 2.3 Why this architecture works

- **Zero-fee transfers** are real because money moves wallet-to-wallet inside the ledger, not across banks per-transaction
- **Multi-currency pools** mean no SWIFT wire is needed for individual transfers; bulk rebalancing happens off-platform
- **Hash chain** gives cryptographic immutability without the cost/latency of public blockchain settlement
- **Polygon anchoring** provides public verifiability for the audit story without slowing down user experience
- **Revenue model** (for the pitch): transparent FX spread (0.5-1%) + float interest + premium features. Never per-transaction fees.

---

## 3. Database Schema

All tables live in Supabase Postgres with Row Level Security (RLS) enabled.

### 3.1 `users`
Managed by Supabase Auth. Extended with a `profiles` table:

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  country_code text not null,        -- 'AE', 'IN', 'US'
  language text default 'en',         -- 'en', 'hi'
  kyc_status text default 'pending',  -- 'pending', 'verified', 'rejected'
  kyc_document_url text,
  created_at timestamptz default now()
);
```

### 3.2 `wallets`
Each user can hold multiple currency balances.

```sql
create table wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  currency text not null,             -- 'USD', 'INR', 'AED'
  balance numeric(20, 4) not null default 0,
  created_at timestamptz default now(),
  unique (user_id, currency)
);
```

### 3.3 `transactions` (the hash-chained ledger)
The cryptographic backbone. Each row links to the previous one.

```sql
create table transactions (
  id bigserial primary key,
  from_wallet_id uuid references wallets(id),
  to_wallet_id uuid references wallets(id),
  from_amount numeric(20, 4) not null,
  from_currency text not null,
  to_amount numeric(20, 4) not null,
  to_currency text not null,
  fx_rate numeric(20, 8) not null,
  tx_type text not null,              -- 'transfer', 'topup', 'withdraw', 'investment'
  status text default 'completed',    -- 'pending', 'completed', 'flagged'
  prev_hash text,                     -- hash of previous transaction
  current_hash text not null,         -- SHA-256(row data + prev_hash)
  polygon_anchor_tx text,             -- nullable: filled when batch-anchored
  created_at timestamptz default now()
);

create index idx_tx_user on transactions(from_wallet_id);
create index idx_tx_created on transactions(created_at desc);
```

### 3.4 `fx_rates_cache`
Hourly snapshots of live rates to avoid hammering the FX API.

```sql
create table fx_rates_cache (
  base_currency text not null,
  target_currency text not null,
  rate numeric(20, 8) not null,
  fetched_at timestamptz default now(),
  primary key (base_currency, target_currency, fetched_at)
);
```

### 3.5 `aml_flags`
Compliance audit trail.

```sql
create table aml_flags (
  id uuid primary key default gen_random_uuid(),
  transaction_id bigint references transactions(id),
  rule_triggered text not null,       -- 'amount_over_threshold', 'velocity_check', etc.
  severity text not null,             -- 'low', 'medium', 'high'
  resolved boolean default false,
  notes text,
  created_at timestamptz default now()
);
```

### 3.6 `polygon_anchors`
Batched chain commits to Polygon.

```sql
create table polygon_anchors (
  id bigserial primary key,
  chain_hash text not null,           -- the SHA-256 anchor being committed
  polygon_tx_hash text not null,      -- the Polygon transaction hash
  anchored_at timestamptz default now(),
  from_tx_id bigint,
  to_tx_id bigint
);
```

### 3.7 RLS policies (essential, don't skip)

```sql
-- Users see only their own wallets
create policy "users see own wallets" on wallets
  for select using (auth.uid() = user_id);

-- Users see transactions involving their wallets
create policy "users see own transactions" on transactions
  for select using (
    from_wallet_id in (select id from wallets where user_id = auth.uid())
    or to_wallet_id in (select id from wallets where user_id = auth.uid())
  );

-- Admin role can see all (for compliance dashboard)
create policy "admin sees all transactions" on transactions
  for select using (
    exists (select 1 from profiles where id = auth.uid() and country_code = 'ADMIN')
  );
```

---

## 4. Project Structure

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx              # mobile-frame container + bottom nav
│   │   ├── page.tsx                 # home / wallet balance
│   │   ├── send/page.tsx            # send money flow
│   │   ├── send/confirm/page.tsx    # FX breakdown screen (hero)
│   │   ├── history/page.tsx        # transaction list
│   │   ├── history/[id]/page.tsx   # tx detail + hash chain viewer
│   │   ├── insights/page.tsx       # AI insight cards
│   │   ├── invest/page.tsx         # micro-investment / round-up jar
│   │   ├── kyc/page.tsx            # document upload + selfie
│   │   └── settings/page.tsx       # language, privacy, audit log
│   ├── (admin)/
│   │   ├── compliance/page.tsx     # AML dashboard
│   │   ├── pools/page.tsx          # liquidity pool view (USD + INR)
│   │   └── chain/page.tsx          # full hash chain verifier
│   ├── api/
│   │   ├── transfer/route.ts       # POST /api/transfer
│   │   ├── fx/route.ts             # GET /api/fx?from=USD&to=INR
│   │   ├── insights/route.ts       # POST /api/insights (calls Claude)
│   │   ├── anchor/route.ts         # POST /api/anchor (cron job)
│   │   └── verify-chain/route.ts   # GET /api/verify-chain
│   └── globals.css
├── components/
│   ├── ui/                          # shadcn primitives
│   ├── MobileFrame.tsx              # max-w-md wrapper
│   ├── BottomNav.tsx
│   ├── WalletCard.tsx
│   ├── TransactionRow.tsx
│   ├── FXBreakdown.tsx              # the hero component
│   ├── HashChainViewer.tsx
│   ├── InsightCard.tsx
│   └── LanguageToggle.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # browser client
│   │   ├── server.ts                # server client
│   │   └── middleware.ts            # auth middleware
│   ├── chain.ts                     # hash chain logic (computeHash, verifyChain)
│   ├── fx.ts                        # fetch + cache FX rates
│   ├── transfer.ts                  # transfer business logic
│   ├── polygon.ts                   # ethers.js + anchor contract
│   ├── ai.ts                        # Anthropic API wrapper
│   ├── aml.ts                       # AML rule engine
│   └── i18n/                        # translation files
├── contracts/
│   └── LedgerAnchor.sol             # Solidity contract for Polygon
├── public/
│   ├── manifest.json                # PWA manifest
│   ├── icons/                       # app icons (192, 512)
│   └── locales/                     # i18n JSON files
├── scripts/
│   ├── seed.ts                      # seed demo data (Ravi + mother)
│   └── deploy-contract.ts           # deploy Solidity to Amoy
└── middleware.ts                    # Next.js middleware for auth
```

---

## 5. Core Logic Snippets

### 5.1 Hash chain (`lib/chain.ts`)

```typescript
import { createHash } from 'crypto';

export function computeTxHash(tx: {
  id: number;
  from_wallet_id: string;
  to_wallet_id: string;
  from_amount: number;
  to_amount: number;
  fx_rate: number;
  created_at: string;
  prev_hash: string | null;
}): string {
  const payload = [
    tx.id,
    tx.from_wallet_id,
    tx.to_wallet_id,
    tx.from_amount,
    tx.to_amount,
    tx.fx_rate,
    tx.created_at,
    tx.prev_hash ?? 'GENESIS'
  ].join('|');
  return createHash('sha256').update(payload).digest('hex');
}

export async function verifyChain(transactions: any[]): Promise<{
  valid: boolean;
  brokenAt: number | null;
}> {
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const expected = computeTxHash(tx);
    if (expected !== tx.current_hash) {
      return { valid: false, brokenAt: tx.id };
    }
    if (i > 0 && tx.prev_hash !== transactions[i - 1].current_hash) {
      return { valid: false, brokenAt: tx.id };
    }
  }
  return { valid: true, brokenAt: null };
}
```

### 5.2 FX rate fetcher (`lib/fx.ts`)

```typescript
const FX_TTL_MS = 60 * 60 * 1000; // 1 hour cache

export async function getFxRate(
  from: string,
  to: string
): Promise<{ rate: number; fetchedAt: Date }> {
  // Check cache first
  const cached = await supabase
    .from('fx_rates_cache')
    .select('*')
    .eq('base_currency', from)
    .eq('target_currency', to)
    .gte('fetched_at', new Date(Date.now() - FX_TTL_MS).toISOString())
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  if (cached.data) {
    return { rate: cached.data.rate, fetchedAt: new Date(cached.data.fetched_at) };
  }

  // Fetch fresh
  const res = await fetch(`https://api.exchangerate.host/latest?base=${from}&symbols=${to}`);
  const data = await res.json();
  const rate = data.rates[to];

  // Apply small margin (this is where we make money in the demo story)
  const userFacingRate = rate * 0.998; // 0.2% spread

  await supabase.from('fx_rates_cache').insert({
    base_currency: from,
    target_currency: to,
    rate: userFacingRate
  });

  return { rate: userFacingRate, fetchedAt: new Date() };
}
```

### 5.3 Transfer logic (`lib/transfer.ts`)

```typescript
export async function executeTransfer(params: {
  fromUserId: string;
  toUserPhone: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;          // amount in fromCurrency
}) {
  // 1. Get FX rate
  const { rate } = await getFxRate(params.fromCurrency, params.toCurrency);
  const toAmount = params.amount * rate;

  // 2. Resolve wallets (or auto-create INR wallet for recipient)
  const fromWallet = await getOrCreateWallet(params.fromUserId, params.fromCurrency);
  const toUser = await findUserByPhone(params.toUserPhone);
  const toWallet = await getOrCreateWallet(toUser.id, params.toCurrency);

  // 3. Check balance
  if (fromWallet.balance < params.amount) throw new Error('Insufficient balance');

  // 4. AML check
  const flags = await runAmlChecks({ fromWallet, amount: params.amount });

  // 5. Atomic transaction via Supabase RPC
  const { data, error } = await supabase.rpc('execute_transfer', {
    p_from_wallet: fromWallet.id,
    p_to_wallet: toWallet.id,
    p_from_amount: params.amount,
    p_to_amount: toAmount,
    p_fx_rate: rate,
  });

  if (error) throw error;

  // 6. Compute and store hash
  const prevHash = await getLatestChainHash();
  const newHash = computeTxHash({ ...data, prev_hash: prevHash });
  await supabase.from('transactions').update({ current_hash: newHash }).eq('id', data.id);

  return data;
}
```

### 5.4 AI insights (`lib/ai.ts`)

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateInsight(userId: string, language: 'en' | 'hi') {
  // Pull last 10 transactions
  const txs = await getRecentTransactions(userId, 10);
  const profile = await getProfile(userId);

  const prompt = `You are a friendly financial advisor for a migrant worker.
User: ${profile.full_name}, sends remittances from ${profile.country_code} to family.
Recent transactions: ${JSON.stringify(txs)}

In ${language === 'hi' ? 'Hindi' : 'English'}, write a SHORT (max 50 words) personalized 
savings tip based on their pattern. Be warm and specific. Mention concrete numbers.`;

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }]
  });

  return msg.content[0].type === 'text' ? msg.content[0].text : '';
}
```

### 5.5 Polygon anchor contract (`contracts/LedgerAnchor.sol`)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LedgerAnchor {
    mapping(uint256 => bytes32) public anchors;
    uint256 public latestAnchorId;
    address public owner;
    
    event Anchored(uint256 indexed id, bytes32 hash, uint256 timestamp);
    
    constructor() {
        owner = msg.sender;
    }
    
    function anchor(bytes32 chainHash) external {
        require(msg.sender == owner, "Unauthorized");
        latestAnchorId++;
        anchors[latestAnchorId] = chainHash;
        emit Anchored(latestAnchorId, chainHash, block.timestamp);
    }
    
    function verify(uint256 id, bytes32 expectedHash) external view returns (bool) {
        return anchors[id] == expectedHash;
    }
}
```

Deploy via Remix IDE to Polygon Amoy testnet. Save contract address to `.env.local`.

---

## 6. Team Allocation

| Person | Role | Owns |
|---|---|---|
| P1 | Backend lead | DB schema, RLS, transfer RPC, hash chain, FX caching, AML rules |
| P2 | Frontend lead | All UI screens, mobile frame, PWA setup, i18n, bottom nav |
| P3 | AI + blockchain | Claude API integration, Solidity contract, Polygon anchoring cron |
| P4 | Design + pitch | UI polish, demo data seeding, pitch deck, demo video, README |

**Rule:** one person, one ownership area. No two people touch the same module. P4 starts helping wherever needed once design system is locked.

---

## 7. 24-Hour Timeline

### Hour 0 – 1: Setup & alignment
- [ ] Repo initialized, all 4 members can push
- [ ] Supabase project created, schema SQL run
- [ ] Vercel linked to repo, auto-deploy working
- [ ] Demo storyboard agreed on (Ravi → mother)
- [ ] Cut list signed in blood (voice, 2nd language, webcam KYC are first to go)

### Hour 1 – 6: Parallel foundation
- **P1:** DB schema deployed, profiles + wallets + transactions tables, basic transfer RPC
- **P2:** Next.js scaffold, mobile frame, route stubs for all screens, shadcn installed, bottom nav
- **P3:** Solidity contract written + deployed to Polygon Amoy, ethers.js integration spike
- **P4:** Figma flows, demo persona scripts, logo + app icon, deck skeleton

### Hour 6 – 12: Wire core flow end-to-end
- **P1 + P2:** Send money form → transfer RPC → realtime tx list visible to both users
- **P1:** Hash chain logic integrated, every tx gets a hash
- **P3:** Backend cron anchors chain hash to Polygon every 5 transactions
- **P4:** Real screenshots in deck, demo data being seeded

**HOUR 12 CHECKPOINT:** end-to-end transfer works on phone. Stop. Test on real device. Fix anything broken.

### Hour 12 – 16: AI + FX + multi-currency
- **P3:** Claude API insight cards working, localized prompts, streaming UX
- **P1:** Live USD↔INR rate from exchangerate.host, pool dashboard for admin
- **P2:** FX breakdown screen (hero), round-up jar UI, micro-investment basket
- **P4:** Insight card visual design polish

### Hour 16 – 20: Deep features & compliance
- **P3:** Webcam KYC via `getUserMedia` (cut to file upload if behind)
- **P1:** AML rules engine, admin compliance dashboard, audit log viewer
- **P2:** Voice command via Web Speech API, Hindi translation fully wired
- **P4:** All design polish, skeleton loaders, empty states, error toasts

### Hour 20 – 22: Polish & deploy
- [ ] Production deploy, custom domain
- [ ] QR code on landing page → demo URL
- [ ] Architecture diagram finalized
- [ ] README polished with screenshots
- [ ] All console errors fixed
- [ ] Cross-browser test (Chrome mobile, Safari mobile)

### Hour 22 – 24: Demo prep
- [ ] Seed Ravi (Dubai USD) + mother (Kerala INR) with 30+ realistic transactions
- [ ] Record 3-minute demo video as backup (in case wifi dies)
- [ ] Finalize 8-slide deck
- [ ] Three full rehearsals
- [ ] Q&A bank prepared
- [ ] Sleep 30-45 min before presentation if possible

---

## 8. Sleep Discipline

24 hours awake = degraded output after hour 18. Plan:

- **Hour 16-18:** P1 + P3 sleep 1.5 hours. P2 + P4 keep working.
- **Hour 18-20:** Swap. P2 + P4 sleep 1.5 hours. P1 + P3 keep working.
- **Hour 22-24:** Everyone awake for rehearsal and demo.

Bugs introduced after hour 18 of consecutive wakefulness are nearly all fatigue-related. Cheaper to sleep than to debug.

---

## 9. Demo Storyboard (3 minutes)

The build is structured around delivering exactly this flow:

1. **Open app on phone via QR code** (judges scan with their own phone — 5 sec)
2. **Login as Ravi** (Dubai, USD wallet pre-loaded with $500)
3. **Switch language to Hindi** (shows multilingual)
4. **Tap "Send home"**
5. **Enter ₹15,000 amount, select mother**
6. **See FX breakdown screen — the hero moment:**
   - You pay: $180.65 USD
   - Rate: 1 USD = 83.20 INR (live, you save $2.30 vs banks)
   - Fee: $0.00
   - She receives: ₹15,000.00
   - Arrives: Instant
7. **Confirm with biometric mock**
8. **Show hash chain receipt** — click the hash, opens PolygonScan link (real Polygon Amoy tx)
9. **AI insight card appears:** "Ravi, you've sent $1,200 home this quarter. Saving $20/week could build a $1,040 emergency fund by year-end."
10. **Tap "Start ₹100 SIP"** → micro-investment screen
11. **Switch to admin view:** show liquidity pools (USD vs INR) and the same transaction in compliance audit log

---

## 10. Cut List (in order)

If behind schedule, cut in this order:

1. Voice command via Web Speech API
2. Second language fully wired (keep just labels in EN)
3. Webcam KYC selfie (use file upload instead)
4. Round-up jar animation
5. Polygon anchoring (fall back to "blockchain-inspired" hash chain only)

**Never cut:** end-to-end transfer flow, FX breakdown screen, AI insight, KYC mock, admin dashboard.

---

## 11. Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Supabase RLS misconfigured, transactions visible to wrong users | Medium | Test RLS at hour 6 with two test accounts |
| Polygon anchor fails because Amoy faucet runs dry | Low | Get faucet MATIC at hour 1, well before need |
| FX API rate-limited | Low | Cache 1 hour, fallback to hardcoded rate |
| Hindi translation looks broken | Medium | Have a Hindi-speaking team member or native speaker review at hour 16 |
| Vercel build fails at deploy time | Low | Deploy at hour 12 first, fix any build issues then, not at hour 23 |
| Wifi dies during demo | Medium | Record backup video at hour 22, have on phone ready |
| Real device demo doesn't work | High | Test on real phone at hour 12 checkpoint, not at hour 22 |

---

## 12. Pitch Deck Outline (8 slides)

1. **The problem** — 250M migrant workers, $700B in remittances, average fee 6.2%, slow settlement
2. **Our solution** — zero-fee wallet-to-wallet remittance with AI guidance
3. **Demo** — live walkthrough (or backup video)
4. **How zero fees work** — multi-currency liquidity pools, transparent FX spread, no SWIFT per transaction
5. **Trust & security** — hash-chained ledger, Polygon anchoring, RBI MTSS-compliant
6. **Inclusion & AI** — multilingual, voice input, personalized financial guidance
7. **Revenue model** — FX spread (0.5-1%), float interest, premium features. No per-transaction user fees.
8. **The team + ask** — who we are, what's next

---

## 13. Q&A Preparation

Have answers ready for:

- **"How do you make money if there are no fees?"** → FX spread (transparent, shown to user), float interest, premium features. Same model as Wise.
- **"Is this on a real blockchain?"** → SHA-256 hash chain primary (same primitive Bitcoin uses), with periodic anchoring to Polygon Amoy for public verifiability. Show PolygonScan link.
- **"How do migrants top up their wallet?"** → In production: UPI for India users, Stripe/Adyen card top-up for foreign users, agent cash-in for unbanked. For demo: pre-loaded balances to focus on the core transfer experience.
- **"Is this legal in India?"** → Operates under RBI MTSS partnership model with authorized AD-II banks. All inward remittances KYC-verified and AML-screened per RBI guidelines.
- **"What's the unit economics at scale?"** → 0.5% FX spread on $500 avg remittance = $2.50/tx. At 10M tx/month = $25M revenue. Float on $50M average balance at 4% = $2M annual interest.
- **"How is this different from PhonePe / Paytm?"** → Those are domestic-only. We're cross-border-first, with FX transparency and AI guidance built for the migrant worker persona specifically.

---

## 14. Reference Projects (study, don't fork)

- **vercel/nextjs-subscription-payments** — clone for the Next.js + Supabase + auth boilerplate; strip the Stripe parts
- **iamhamzaawan/Blockchain-based-Cross-Border-Remittance-System** — read the README to understand transaction state machine patterns
- **challamani/multi-currency-wallet** — confirms our pool-based architecture is sound

---

## 15. Setup Commands (hour 0)

```bash
# Frontend scaffold
npx create-next-app@latest fintech-wallet --typescript --tailwind --app

cd fintech-wallet

# Supabase + shadcn + utilities
npm install @supabase/supabase-js @supabase/ssr
npm install @anthropic-ai/sdk
npm install ethers
npx shadcn@latest init
npx shadcn@latest add button input card dialog form toast

# PWA
npm install next-pwa
npm install next-intl

# Env vars (.env.local)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
POLYGON_AMOY_RPC=https://rpc-amoy.polygon.technology
POLYGON_PRIVATE_KEY=
LEDGER_ANCHOR_CONTRACT=

# Deploy to Vercel
vercel --prod
```

---

## 16. Success Criteria

By end of hour 24:

- [ ] Demo URL works on any mobile phone via QR code
- [ ] Full transfer flow completes in under 30 seconds
- [ ] FX breakdown screen shows live rates with clear margin disclosure
- [ ] At least one transaction visible on Polygon Amoy via PolygonScan
- [ ] AI insight card generates in user's language
- [ ] Admin dashboard shows the same transaction with compliance metadata
- [ ] Pitch deck is 8 slides, no more
- [ ] Backup demo video recorded
- [ ] Three rehearsals complete
- [ ] All seven problem statement objectives demonstrably addressed

---

*This is a living document. Update the checkboxes as you complete tasks. If a section becomes irrelevant due to scope cuts, strike it through but don't delete — the cut history helps explain decisions during Q&A.*