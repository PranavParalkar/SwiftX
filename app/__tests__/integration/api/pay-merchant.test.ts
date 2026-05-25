/**
 * /api/pay/merchant integration tests.
 *
 * Risks covered: R-01 (validation), R-04 (PII redaction in ledger)
 * Test cases   : TC-02-07 (insufficient balance), TC-07-04 (UPI format validation)
 */

import { createMockSupabase, MockSupabase } from '../../helpers/supabaseMock'
import { buildRequest } from '../../helpers/nextRequest'
import { TEST_USERS } from '../../fixtures/users'

let mockSb: MockSupabase
let mockSrv: MockSupabase
jest.mock('@/lib/supabase/admin', () => {
  const { createMockSupabase } = require('../../helpers/supabaseMock')
  mockSb = createMockSupabase()
  return { adminClient: mockSb }
})
jest.mock('@/lib/supabase/server', () => {
  const { createMockSupabase } = require('../../helpers/supabaseMock')
  mockSrv = createMockSupabase()
  return { createClient: async () => mockSrv }
})
jest.mock('@/lib/ledger', () => ({ __esModule: true, logEvent: jest.fn(async () => {}) }))

import { POST } from '@/app/api/pay/merchant/route'
import { logEvent } from '@/lib/ledger'

beforeEach(() => {
  mockSb.resetQueues()
  mockSrv.resetQueues()
  jest.clearAllMocks()
  ;(mockSrv.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: { id: TEST_USERS.ravi.id } },
  })
})

describe('POST /api/pay/merchant', () => {
  it('rejects when amount is missing or non-positive', async () => {
    for (const bad of [0, -10, undefined, null, '']) {
      const res = await POST(buildRequest({
        method: 'POST',
        body: { method: 'upi', merchant_handle: 'shop@hdfc', amount: bad },
      }))
      expect(res.status).toBe(400)
    }
  })

  it('rejects unsupported method', async () => {
    const res = await POST(buildRequest({
      method: 'POST',
      body: { method: 'crypto', merchant_handle: 'x', amount: 10 },
    }))
    expect(res.status).toBe(400)
  })

  it('TC-07-04 :: rejects malformed UPI ID', async () => {
    const res = await POST(buildRequest({
      method: 'POST',
      body: { method: 'upi', merchant_handle: 'not-a-vpa', amount: 100 },
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/Invalid UPI ID/i)
  })

  it('TC-02-07 :: rejects when wallet balance is below amount', async () => {
    mockSb.queue('wallets_inr', 'select', { data: { balance: 50 }, error: null })
    const res = await POST(buildRequest({
      method: 'POST',
      body: { method: 'upi', merchant_handle: 'shop@hdfc', amount: 500, currency: 'INR' },
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/Insufficient/i)
  })

  it('happy path :: debits wallet, records payment, logs to ledger', async () => {
    mockSb.queue('wallets_inr', 'select', { data: { balance: 1000 }, error: null })
    mockSb.queue('wallets_inr', 'update', { data: {}, error: null })
    mockSb.queue('merchant_payments', 'insert', { data: {}, error: null })

    const res = await POST(buildRequest({
      method: 'POST',
      body: { method: 'upi', merchant_handle: 'shop@hdfc', merchant_name: 'Test Shop', amount: 250, currency: 'INR' },
    }))
    expect(res.status).toBe(200)
    const j = await res.json()
    expect(j.success).toBe(true)
    expect(j.payment_ref).toMatch(/^MP_/)

    // Wallet debited correctly
    const upd = mockSb.lastWrite('wallets_inr')
    expect(upd.balance).toBe(750)

    // Ledger: UPI handle is shareable, kept full; non-UPI would be masked
    expect(logEvent).toHaveBeenCalled()
    const arg = (logEvent as jest.Mock).mock.calls[0][0]
    expect(arg.payload.merchant_handle).toBe('shop@hdfc')
  })

  it('bank-transfer route masks the account number in the ledger', async () => {
    mockSb.queue('wallets_inr', 'select', { data: { balance: 5000 }, error: null })
    mockSb.queue('wallets_inr', 'update', { data: {}, error: null })
    mockSb.queue('merchant_payments', 'insert', { data: {}, error: null })

    const res = await POST(buildRequest({
      method: 'POST',
      body: { method: 'bank', merchant_handle: '12345678901234', routing_code: 'HDFC0000001', amount: 100, currency: 'INR' },
    }))
    expect(res.status).toBe(200)
    const arg = (logEvent as jest.Mock).mock.calls[0][0]
    expect(arg.payload.merchant_handle).toBe('1234')   // last 4 only
  })
})
