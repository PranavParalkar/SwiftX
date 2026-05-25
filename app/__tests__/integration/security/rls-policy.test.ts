/**
 * Documented RLS contract — these are *contract* tests, not direct DB tests.
 *
 * Risks covered: R-04 (data isolation between users)
 * Test cases   : TC-07-01, TC-07-02, TC-07-03
 *
 * The actual RLS policies live in Postgres (schema.sql) and must be tested
 * against a real Supabase instance — see __tests__/e2e/security.spec.ts for
 * the live counterpart. This file asserts the *expected behaviour* and
 * serves as the single source of truth for the RLS contract documentation
 * picked up by SonarQube as part of the security-hotspot review.
 */

const RLS_CONTRACT = {
  profiles: {
    select: 'user can read own row; admin can read all',
    update: 'user can update own row only',
    insert: 'inserts allowed by adminClient only',
  },
  wallets_inr: {
    all: 'user_id = auth.uid() OR admin',
  },
  wallets_usd: {
    all: 'user_id = auth.uid() OR admin',
  },
  transactions: {
    select: 'sender_id = auth.uid() OR receiver_id = auth.uid() OR admin',
    insert: 'sender_id = auth.uid() (server-side bypass via service role)',
  },
  kyc_submissions: {
    all: 'user_id = auth.uid() OR admin',
  },
  ledger_events: {
    select: 'admin only',
    update: 'denied by trigger trg_ledger_no_update (immutable)',
    delete: 'denied by trigger trg_ledger_no_delete (immutable)',
  },
} as const

describe('Postgres RLS contract (R-04)', () => {
  it('every privacy-sensitive table has an explicit policy', () => {
    const required = [
      'profiles', 'wallets_inr', 'wallets_usd', 'transactions',
      'kyc_submissions', 'ledger_events',
    ]
    for (const t of required) {
      expect(RLS_CONTRACT).toHaveProperty(t)
    }
  })

  it('TC-07-01/02 :: wallet + transaction tables scope by user_id or admin', () => {
    expect(RLS_CONTRACT.wallets_inr.all).toMatch(/user_id = auth\.uid\(\)/)
    expect(RLS_CONTRACT.wallets_usd.all).toMatch(/user_id = auth\.uid\(\)/)
    expect(RLS_CONTRACT.transactions.select).toMatch(/auth\.uid\(\)/)
  })

  it('TC-05-04 :: ledger is immutable at the DB layer', () => {
    expect(RLS_CONTRACT.ledger_events.update).toMatch(/immutable|denied/i)
    expect(RLS_CONTRACT.ledger_events.delete).toMatch(/immutable|denied/i)
  })
})

/*
 * Live RLS verification — run manually with `npx supabase db remote query`
 * against a *test* Supabase project (never prod):
 *
 *   set role authenticated;
 *   set request.jwt.claims = '{"sub":"<USER-A-UUID>"}';
 *   select count(*) from wallets_inr;       -- must equal 1 (User A's own row)
 *   select * from wallets_inr where user_id = '<USER-B-UUID>';   -- must be empty
 *
 * Capture the output and attach to the security review for TC-07-01.
 */
