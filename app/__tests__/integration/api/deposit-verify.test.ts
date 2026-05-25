/**
 * /api/deposit/verify integration tests.
 *
 * Risks covered: R-04 (signature forgery), R-03 (Razorpay outage)
 * Test cases   : TC-03-10 (signature verification), TC-07-08 (auth required)
 *
 * The verify endpoint accepts a Razorpay payment, validates HMAC,
 * and credits the wallet. The MOCK fast-path used in dev is also exercised.
 */

import { createMockSupabase, MockSupabase } from '../../helpers/supabaseMock'
import { buildRequest } from '../../helpers/nextRequest'
import { createHmac } from 'crypto'
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

import { POST } from '@/app/api/deposit/verify/route'

const ORDER_ID = 'order_abc'
const PAY_ID   = 'pay_xyz'
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!

function realSignature() {
  return createHmac('sha256', KEY_SECRET).update(`${ORDER_ID}|${PAY_ID}`).digest('hex')
}

beforeEach(() => {
  mockSb.resetQueues()
  mockSrv.resetQueues()
  jest.clearAllMocks()
  ;(mockSrv.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: { id: TEST_USERS.ravi.id } },
  })
  // Wallet read + update for the credit step
  mockSb.queue('wallets_inr', 'select', { data: { balance: 1000 }, error: null })
  mockSb.queue('wallets_inr', 'update', { data: {}, error: null })
  mockSb.queue('deposits',     'insert', { data: {}, error: null })

  delete process.env.RAZORPAY_DEV_MOCK   // default to real verify path
})

describe('POST /api/deposit/verify (R-04)', () => {
  it('TC-07-08 :: 401 unauthenticated', async () => {
    ;(mockSrv.auth.getUser as jest.Mock).mockResolvedValueOnce({ data: { user: null } })
    const res = await POST(buildRequest({
      method: 'POST',
      body: { razorpay_order_id: ORDER_ID, razorpay_payment_id: PAY_ID, razorpay_signature: 'x', amount: 100 },
    }))
    expect(res.status).toBe(401)
  })

  it('400 when any payment field is missing', async () => {
    const res = await POST(buildRequest({
      method: 'POST',
      body: { razorpay_order_id: ORDER_ID, amount: 100 },
    }))
    expect(res.status).toBe(400)
  })

  it('TC-03-10 :: verifies the HMAC signature and credits wallet', async () => {
    const sig = realSignature()
    const res = await POST(buildRequest({
      method: 'POST',
      body: {
        razorpay_order_id: ORDER_ID,
        razorpay_payment_id: PAY_ID,
        razorpay_signature: sig,
        amount: 100,
        currency: 'INR',
        method: 'upi',
      },
    }))
    expect(res.status).toBe(200)
    const j = await res.json()
    expect(j.success).toBe(true)
    expect(j.razorpay_ref).toBe(PAY_ID)

    // The wallet update payload must reflect the new balance
    const upd = mockSb.lastWrite('wallets_inr')
    expect(upd.balance).toBe(1100)
  })

  it('TC-07-04-style :: rejects a forged signature (different bytes)', async () => {
    const res = await POST(buildRequest({
      method: 'POST',
      body: {
        razorpay_order_id: ORDER_ID,
        razorpay_payment_id: PAY_ID,
        razorpay_signature: 'a'.repeat(64),       // fake
        amount: 100,
      },
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/Signature verification failed/i)
    expect(mockSb.lastWrite('wallets_inr')).toBeUndefined()  // no credit
  })

  it('rejects a forged signature of equal length but wrong bytes (timing-safe path)', async () => {
    const wrong = createHmac('sha256', 'attacker-secret').update('whatever').digest('hex')
    const res = await POST(buildRequest({
      method: 'POST',
      body: {
        razorpay_order_id: ORDER_ID,
        razorpay_payment_id: PAY_ID,
        razorpay_signature: wrong,
        amount: 100,
      },
    }))
    expect(res.status).toBe(400)
  })

  it('mock mode :: with RAZORPAY_DEV_MOCK=1 and MOCK_-prefixed IDs, signature is skipped', async () => {
    process.env.RAZORPAY_DEV_MOCK = '1'
    const res = await POST(buildRequest({
      method: 'POST',
      body: {
        razorpay_order_id: 'order_MOCK_123',
        razorpay_payment_id: 'pay_MOCK_456',
        razorpay_signature: 'mock',
        amount: 200,
        currency: 'INR',
      },
    }))
    expect(res.status).toBe(200)
    const upd = mockSb.lastWrite('wallets_inr')
    expect(upd.balance).toBe(1200)
  })

  it('mock-mode bypass is double-gated — non-MOCK ids still need real signature', async () => {
    process.env.RAZORPAY_DEV_MOCK = '1'
    const res = await POST(buildRequest({
      method: 'POST',
      body: {
        razorpay_order_id: 'order_REAL_999',     // not MOCK prefix
        razorpay_payment_id: 'pay_REAL_999',
        razorpay_signature: 'mock',
        amount: 100,
      },
    }))
    expect(res.status).toBe(400)
  })
})
