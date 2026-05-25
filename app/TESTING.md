# SwiftX Testing Strategy

This document is the operational companion to **Assignment 5 — Test Scenarios and Cases**. Every test case in the assignment doc maps to one or more files under `__tests__/`. Run any layer in isolation, or run the full TDD-style pyramid.

## Test pyramid

```
              ┌────────────────────────────┐
              │   Load (k6)   · 2 scripts  │   TC-09-01..05
              └────────────────────────────┘
            ┌─────────────────────────────────┐
            │   E2E (Playwright) · 4 specs    │   TC-01, TC-07, TC-10
            └─────────────────────────────────┘
          ┌────────────────────────────────────────┐
          │ Integration (Jest, mocked Supabase)   │   TC-01, TC-03, TC-07
          │ · auth-register · kyc-submit · ...    │
          └────────────────────────────────────────┘
        ┌──────────────────────────────────────────────┐
        │ Unit (Jest, pure TS)                         │   TC-04, TC-05, TC-06 etc
        │ · forex math · ledger hash · validators · i18n│
        └──────────────────────────────────────────────┘
       ┌──────────────────────────────────────────────────┐
       │ Static — ESLint, TypeScript, SonarQube quality  │   any-risk gate
       └──────────────────────────────────────────────────┘
```

## Setup

```bash
cd app
npm install                       # installs Jest, Playwright, ts-jest, etc.
npx playwright install chromium   # for E2E only
```

## Commands

| Command | What it runs |
|---|---|
| `npm test` | Both Jest projects (unit + integration) |
| `npm run test:unit` | Pure-TS unit suite only |
| `npm run test:integration` | API route + RLS contract tests |
| `npm run test:watch` | Watch mode, fastest dev loop |
| `npm run test:coverage` | LCOV + HTML coverage report under `coverage/` |
| `npm run test:ci` | Same as `:coverage`, CI mode (no watch, 2 workers) |
| `npm run test:e2e` | Playwright suite — needs a running `npm run dev` *or* `npm run start` |
| `npm run test:e2e:ui` | Playwright interactive runner |
| `npm run test:load:transfer` | k6 50-VU transfer load test |
| `npm run test:load:fx` | k6 FX cache-hit perf test |
| `npm run sonar` | SonarQube scan (needs `SONAR_TOKEN`, `SONAR_HOST_URL`) |

## Risk → test traceability matrix

| Risk | Description | Files |
|------|---|---|
| **R-01** | AI / model accuracy drift, FX maths, transfer accuracy | `unit/lib/forex.test.ts`, `unit/lib/transfer.test.ts`, `unit/validation/amount-validation.test.ts` |
| **R-02** | Bias detection (i18n parity) | `unit/lib/i18n.test.ts`, `e2e/i18n.spec.ts` |
| **R-03** | Supabase / external integration failures | `unit/lib/transfer.test.ts` (RPC rollback), `unit/lib/forex.test.ts` (fallback rates) |
| **R-04** | PII / auth / RLS | `unit/lib/ledger.test.ts` (redaction), `integration/api/auth-register.test.ts`, `integration/api/deposit-verify.test.ts` (HMAC), `integration/security/rls-policy.test.ts`, `e2e/auth.spec.ts` |
| **R-05** | Performance | `load/transfer.k6.js`, `load/fx.k6.js`, SonarQube code-smell rules |
| **R-07** | Third-party outage | `unit/lib/forex.test.ts` (axios mock 503), `unit/lib/ledger.test.ts` (never-throw) |
| **R-08** | Over-reliance on automation (admin must manually approve) | `integration/api/admin-kyc.test.ts` |
| **R-10** | Document parsing (KYC) | `unit/validation/kyc-validation.test.ts`, `integration/api/kyc-submit.test.ts`, `e2e/kyc-flow.spec.ts` |
| **R-11** | Compute cost (load testing limits + cache hits) | `load/fx.k6.js` |
| **R-12** | User adoption (i18n, a11y, mobile) | `unit/lib/i18n.test.ts`, `e2e/i18n.spec.ts`, Playwright mobile-android project |

## Test-case → file index (selected)

| TC | Risk | Where it lives |
|---|---|---|
| TC-01-01 | R-04 | `e2e/auth.spec.ts`, `integration/api/auth-register.test.ts` |
| TC-01-02 | R-04 | `integration/api/auth-register.test.ts` ("duplicate email") |
| TC-01-05 | R-04 | `e2e/kyc-flow.spec.ts`, `integration/api/kyc-submit.test.ts` |
| TC-01-07 | R-04 | `e2e/admin-approve.spec.ts`, `integration/api/admin-kyc.test.ts` |
| TC-01-08 | R-04 | `e2e/auth.spec.ts` ("unauthenticated /dashboard") |
| TC-02-04/05 | R-01 | `unit/validation/amount-validation.test.ts` |
| TC-02-07 | R-01 | `integration/api/pay-merchant.test.ts` ("Insufficient") |
| TC-03-01 | R-01 | `unit/lib/transfer.test.ts` ("complete summary") |
| TC-03-02/03 | R-01 | `unit/lib/forex.test.ts` ("fee model + math") |
| TC-03-04 | R-01 | `unit/lib/transfer.test.ts` ("Insufficient balance") |
| TC-03-05 | R-03 | `unit/lib/transfer.test.ts` ("unknown recipient") |
| TC-03-08 | R-03 | `unit/lib/transfer.test.ts` ("RPC throws") |
| TC-03-10 | R-05 | `integration/api/deposit-verify.test.ts` (HMAC), `unit/lib/ledger.test.ts` (chain math) |
| TC-04-01/03 | R-07 | `unit/lib/forex.test.ts` |
| TC-05-01..04 | R-05 | `unit/lib/ledger.test.ts` |
| TC-07-01..03 | R-04 | `integration/security/rls-policy.test.ts`, live RLS query |
| TC-07-04 | R-04 | `integration/api/pay-merchant.test.ts` (UPI format), `integration/api/deposit-verify.test.ts` (HMAC forgery) |
| TC-07-05 | R-04 | `integration/api/auth-register.test.ts` (XSS) |
| TC-07-07 | R-04 | SonarQube rule `S2068` (hard-coded credentials) |
| TC-07-08 | R-04 | every integration test asserts `401` when `auth.getUser()` is null |
| TC-09-01 | R-05 | `load/transfer.k6.js` (p95 ≤ 2 s) |
| TC-09-02 | R-05 | `load/fx.k6.js` (p95 ≤ 200 ms) |
| TC-10-01..02 | R-12 | `e2e/i18n.spec.ts` |
| TC-10-06 | R-12 | `e2e/i18n.spec.ts` ("Keyboard accessibility") |

## TDD walk-through (Red → Green → Refactor)

Concrete example for `TC-03-04` (insufficient balance):

1. **RED** — In `unit/lib/transfer.test.ts`, write:
   ```ts
   it('TC-03-04 :: insufficient balance surfaces RPC error', async () => {
     mockSb.queue('execute_transfer', 'rpc', { data: null, error: { message: 'Insufficient balance' } })
     const out = await initiateTransfer({ ...validArgs, amount: 9999 })
     expect(out.error).toBe('Insufficient balance')
   })
   ```
   Run `npm run test:unit` — fails. The function returned `{ summary: {...} }` instead of an error.

2. **GREEN** — In `lib/transfer.ts`, add the guard:
   ```ts
   if (txnErr) return { summary: null!, error: txnErr.message }
   ```
   Test now passes.

3. **REFACTOR** — Extract `runAmlChecks()`, rename variables, re-run all tests. Sonar should report 0 new bugs, ≥ 80 % new-code coverage.

4. **EXTEND** — Add the negative case (recipient frozen, recipient = sender) — each becomes a new test in the same suite.

## SonarQube Quality Gate

Configured by `sonar-project.properties`. The gate is **blocking** on PRs:

| Condition | Threshold |
|---|---|
| New bugs | 0 |
| New vulnerabilities (High / Critical) | 0 |
| New code coverage | ≥ 80 % |
| Duplication on new code | ≤ 3 % |
| Security hotspots | All reviewed |
| New code smells (Blocker) | 0 |

S3 archival: each CI run uploads the Sonar metrics JSON to `s3://<bucket>/sonarqube-reports/<date>_<sha>.json` with SSE-AES-256.

## Live-environment caveats

- The **RLS contract tests** assert the *expected* policy shape. To prove the live database enforces them, run the SQL block at the bottom of `integration/security/rls-policy.test.ts` against your *test* Supabase project (never prod).
- The **E2E suite** registers a fresh user on every run. Use a *test* Supabase project; clean up `auth.users` periodically.
- **k6 load tests** require a real Supabase + Razorpay-mock backend. The transfer script uses a sender cookie — get one from a logged-in browser DevTools session.
- The **mock Razorpay path** (`RAZORPAY_DEV_MOCK=1`) is double-gated: tests confirm that even with the flag on, only `order_MOCK_` / `pay_MOCK_` IDs bypass the HMAC check (see `integration/api/deposit-verify.test.ts`).
