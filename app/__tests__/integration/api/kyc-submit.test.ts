/**
 * /api/kyc integration tests — user submission.
 *
 * Risks covered: R-04 (PII), R-10 (document parsing — handled via separate file
 *                upload tests in E2E)
 * Test cases   : TC-01-05 (success), TC-01-07 (resubmit after rejection),
 *                TC-07-08 (auth required)
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
// Stub ledger so we don't need to mock its DB write here
jest.mock('@/lib/ledger', () => ({
  __esModule: true,
  logEvent: jest.fn(async () => {}),
}))

import { POST, GET } from '@/app/api/kyc/route'
import { logEvent } from '@/lib/ledger'

const validBody = {
  date_of_birth: '1995-04-10',
  gender: 'male',
  nationality: 'IN',
  id_type: 'pan',
  id_number: 'ABCDE1234F',
  address_line1: '12 Test Street',
  address_line2: 'Apt 4',
  city: 'Bengaluru',
  state: 'KA',
  postal_code: '560001',
  country: 'IN',
  bank_account_number: '9876543210',
  bank_ifsc: 'HDFC0000001',
  bank_holder_name: 'Fresh User',
  occupation: 'Engineer',
  source_of_funds: 'salary',
}

beforeEach(() => {
  mockSb.resetQueues()
  mockSrv.resetQueues()
  jest.clearAllMocks()
  ;(mockSrv.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: { id: TEST_USERS.freshSignup.id } },
  })
})

describe('POST /api/kyc — submit', () => {
  it('TC-07-08 :: 401 when unauthenticated', async () => {
    ;(mockSrv.auth.getUser as jest.Mock).mockResolvedValueOnce({ data: { user: null } })
    const res = await POST(buildRequest({ method: 'POST', body: validBody }))
    expect(res.status).toBe(401)
  })

  it('TC-01-05 :: accepts a complete payload and moves profile to pending', async () => {
    // First read: profile for status check
    mockSb.queue('profiles', 'select', { data: { kyc_status: 'not_started' }, error: null })
    // Upsert into kyc_submissions
    mockSb.queue('kyc_submissions', 'upsert', { data: {}, error: null })
    // Update profile.kyc_status
    mockSb.queue('profiles', 'update', { data: {}, error: null })

    const res = await POST(buildRequest({ method: 'POST', body: validBody }))
    expect(res.status).toBe(200)
    const j = await res.json()
    expect(j).toEqual({ success: true, status: 'pending' })

    const upserted = mockSb.lastWrite('kyc_submissions')
    expect(upserted.user_id).toBe(TEST_USERS.freshSignup.id)
    expect(upserted.status).toBe('pending')
    expect(upserted.id_type).toBe('pan')

    // Ledger event must have fired with redacted ID number
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'kyc.submitted',
      actorId: TEST_USERS.freshSignup.id,
    }))
    const ledgerArg = (logEvent as jest.Mock).mock.calls[0][0]
    expect(ledgerArg.payload.id_number_last4).toBe('234F')
    expect(ledgerArg.payload).not.toHaveProperty('id_number')      // no full PAN
    expect(ledgerArg.payload).not.toHaveProperty('bank_account_number')
  })

  it.each([
    'date_of_birth', 'id_type', 'id_number',
    'address_line1', 'city', 'state', 'postal_code', 'country',
    'bank_account_number', 'bank_ifsc', 'bank_holder_name',
  ])('rejects missing field: %s', async (field) => {
    const body: any = { ...validBody }
    delete body[field]
    const res = await POST(buildRequest({ method: 'POST', body }))
    expect(res.status).toBe(400)
    const j = await res.json()
    expect(j.error).toMatch(field)
  })

  it('blocks re-submit while status is verified', async () => {
    mockSb.queue('profiles', 'select', { data: { kyc_status: 'verified' }, error: null })
    const res = await POST(buildRequest({ method: 'POST', body: validBody }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/already verified/i)
  })

  it('blocks re-submit while status is pending', async () => {
    mockSb.queue('profiles', 'select', { data: { kyc_status: 'pending' }, error: null })
    const res = await POST(buildRequest({ method: 'POST', body: validBody }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/under review/i)
  })

  it('TC-01-07 :: allows re-submit after rejection', async () => {
    mockSb.queue('profiles', 'select', { data: { kyc_status: 'rejected' }, error: null })
    mockSb.queue('kyc_submissions', 'upsert', { data: {}, error: null })
    mockSb.queue('profiles', 'update', { data: {}, error: null })

    const res = await POST(buildRequest({ method: 'POST', body: validBody }))
    expect(res.status).toBe(200)
  })
})

describe('GET /api/kyc — status', () => {
  it('TC-07-08 :: 401 when unauthenticated', async () => {
    ;(mockSrv.auth.getUser as jest.Mock).mockResolvedValueOnce({ data: { user: null } })
    const res = await GET(buildRequest({ method: 'GET' }))
    expect(res.status).toBe(401)
  })

  it('returns profile + submission + computed status', async () => {
    mockSb.queue('profiles', 'select', {
      data: { kyc_status: 'pending', full_name: 'Fresh User', email: 'f@e.c', phone: null },
      error: null,
    })
    mockSb.queue('kyc_submissions', 'select', {
      data: { id_type: 'pan', submitted_at: new Date().toISOString() },
      error: null,
    })
    const res = await GET(buildRequest({ method: 'GET' }))
    expect(res.status).toBe(200)
    const j = await res.json()
    expect(j.status).toBe('pending')
    expect(j.profile.full_name).toBe('Fresh User')
  })
})
