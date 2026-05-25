/**
 * Unit tests for lib/ledger.ts
 *
 * Risks covered: R-05 (data integrity), R-04 (PII redaction)
 * Test cases   : TC-05-01, TC-05-02, TC-05-03, TC-05-04, TC-07-04
 */

import { createMockSupabase, MockSupabase } from '../../helpers/supabaseMock'
import { buildRequest } from '../../helpers/nextRequest'

// Mock adminClient before lib/ledger imports it
let mockSb: MockSupabase
jest.mock('@/lib/supabase/admin', () => {
  const { createMockSupabase } = require('../../helpers/supabaseMock')
  mockSb = createMockSupabase()
  return { adminClient: mockSb }
})

// Resolved after mocks are installed
import { logEvent, verifyLedger } from '@/lib/ledger'

describe('lib/ledger — append + verify (R-05, R-04)', () => {
  beforeEach(() => {
    mockSb.from = jest.fn(mockSb.from)
    mockSb.rpc  = jest.fn(mockSb.rpc as any)
    mockSb.resetQueues()
    jest.clearAllMocks()
  })

  it('TC-05-01 :: writes the basic event shape', async () => {
    mockSb.queue('ledger_events', 'insert', { data: { id: 1 }, error: null })

    await logEvent({
      eventType: 'auth.register',
      actorId: 'u1',
      entity: 'profiles',
      entityId: 'u1',
      payload: { email: 'a@b.c' },
    })

    expect(mockSb.from).toHaveBeenCalledWith('ledger_events')
    const written = mockSb.lastWrite('ledger_events')
    expect(written).toMatchObject({
      event_type: 'auth.register',
      actor_id: 'u1',
      entity: 'profiles',
      entity_id: 'u1',
    })
    expect(written.payload).toEqual({ email: 'a@b.c' })
  })

  it('TC-07-04 :: redacts known secret keys from payload', async () => {
    mockSb.queue('ledger_events', 'insert', { data: { id: 2 }, error: null })

    await logEvent({
      eventType: 'transfer.completed',
      actorId: 'u1',
      payload: {
        amount: 100,
        razorpay_signature: 'should-not-appear',
        token: 'leaked-token',
        nested: { password: 'p@ss', visible: 'ok' },
      },
    })

    const written = mockSb.lastWrite('ledger_events')
    expect(written.payload.razorpay_signature).toBe('[redacted]')
    expect(written.payload.token).toBe('[redacted]')
    expect(written.payload.nested.password).toBe('[redacted]')
    // Non-secret keys must survive
    expect(written.payload.amount).toBe(100)
    expect(written.payload.nested.visible).toBe('ok')
  })

  it('TC-05-04 :: ledger never throws — even when DB insert errors', async () => {
    mockSb.queue('ledger_events', 'insert', { data: null, error: { message: 'rls failed' } })

    await expect(logEvent({
      eventType: 'admin.freeze',
      actorId: 'admin-1',
      payload: { reason: 'fraud check' },
    })).resolves.toBeUndefined()
  })

  it('captures IP + UA from a NextRequest when provided', async () => {
    mockSb.queue('ledger_events', 'insert', { data: { id: 3 }, error: null })
    const req = buildRequest({
      method: 'POST',
      headers: {
        'x-forwarded-for': '203.0.113.5, 10.0.0.1',
        'user-agent': 'JestRunner/1.0',
      },
    })
    await logEvent({ eventType: 'deposit.completed', actorId: 'u1', req })

    const written = mockSb.lastWrite('ledger_events')
    expect(written.ip_address).toBe('203.0.113.5')   // first hop, trimmed
    expect(written.user_agent).toBe('JestRunner/1.0')
  })

  it('TC-05-03 :: verifyLedger returns valid chain result', async () => {
    mockSb.queue('ledger_verify', 'rpc', {
      data: [{ is_valid: true, broken_at: null, total_events: 42, head_hash: 'a'.repeat(64) }],
      error: null,
    })
    const v = await verifyLedger()
    expect(v.ok).toBe(true)
    if (v.ok) {
      expect(v.isValid).toBe(true)
      expect(v.brokenAt).toBeNull()
      expect(v.totalEvents).toBe(42)
      expect(v.headHash).toHaveLength(64)
    }
  })

  it('TC-05-04 :: verifyLedger reports brokenAt when chain is tampered', async () => {
    mockSb.queue('ledger_verify', 'rpc', {
      data: [{ is_valid: false, broken_at: 7, total_events: 12, head_hash: 'b'.repeat(64) }],
      error: null,
    })
    const v = await verifyLedger()
    expect(v.ok).toBe(true)
    if (v.ok) {
      expect(v.isValid).toBe(false)
      expect(v.brokenAt).toBe(7)
    }
  })
})

describe('lib/ledger — hash chain math (R-05)', () => {
  // Pure-crypto test that mirrors the Postgres trigger's SHA-256 chain logic.
  // If the production trigger ever drifts from this formula, the integration
  // test in __tests__/integration/security/ledger-integrity.test.ts will catch it.
  const { createHash } = require('crypto')

  function chainHash(prevHash: string, row: object): string {
    const stable = JSON.stringify(row, Object.keys(row).sort())
    return createHash('sha256').update(prevHash + '|' + stable).digest('hex')
  }

  it('TC-05-01 :: genesis hash starts from all-zero prev', () => {
    const genesisPrev = '0'.repeat(64)
    const row = { event_type: 'auth.register', actor_id: 'u1', payload: {} }
    const h = chainHash(genesisPrev, row)
    expect(h).toMatch(/^[a-f0-9]{64}$/)
  })

  it('TC-05-02 :: subsequent hash depends on prev_hash', () => {
    const row = { event_type: 'transfer.completed', amount: 100 }
    const h1 = chainHash('aaa', row)
    const h2 = chainHash('bbb', row)
    expect(h1).not.toBe(h2)
  })

  it('TC-05-04 :: any payload mutation changes the hash', () => {
    const original = chainHash('a'.repeat(64), { amount: 100 })
    const tampered = chainHash('a'.repeat(64), { amount: 9999999 })
    expect(original).not.toBe(tampered)
  })
})
