/**
 * /api/admin/kyc integration tests.
 *
 * Risks covered: R-04 (RLS — admin gating), R-08 (over-reliance on AI/auto-approve)
 * Test cases   : TC-01-07 (admin reject), TC-07-03 (admin role), TC-07-08 (auth required)
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

import { GET, PATCH } from '@/app/api/admin/kyc/route'
import { logEvent } from '@/lib/ledger'

function loginAs(user: typeof TEST_USERS.adminUser | typeof TEST_USERS.ravi | null) {
  if (!user) {
    ;(mockSrv.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } })
    return
  }
  ;(mockSrv.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: user.id } } })
  // Queue the role lookup that requireAdmin() does
  mockSb.queue('profiles', 'select', { data: { role: user.role }, error: null })
}

beforeEach(() => {
  mockSb.resetQueues()
  mockSrv.resetQueues()
  jest.clearAllMocks()
})

describe('GET /api/admin/kyc — list', () => {
  it('TC-07-08 :: 401 unauthenticated', async () => {
    loginAs(null)
    const res = await GET(buildRequest({ method: 'GET' }))
    expect(res.status).toBe(401)
  })

  it('TC-07-03 :: 403 when role is not admin', async () => {
    loginAs(TEST_USERS.ravi)
    const res = await GET(buildRequest({ method: 'GET' }))
    expect(res.status).toBe(403)
  })

  it('returns submissions array when admin', async () => {
    loginAs(TEST_USERS.adminUser)
    mockSb.queue('kyc_submissions', 'select', {
      data: [
        { id: '1', user_id: 'u1', status: 'pending', submitted_at: new Date().toISOString() },
        { id: '2', user_id: 'u2', status: 'pending', submitted_at: new Date().toISOString() },
      ],
      error: null,
    })
    const res = await GET(buildRequest({
      method: 'GET',
      url: 'http://localhost/api/admin/kyc',
      searchParams: { status: 'pending' },
    }))
    expect(res.status).toBe(200)
    const j = await res.json()
    expect(j.submissions).toHaveLength(2)
  })
})

describe('PATCH /api/admin/kyc — approve / reject', () => {
  it('admin can approve a user', async () => {
    loginAs(TEST_USERS.adminUser)
    mockSb.queue('kyc_submissions', 'update', { data: {}, error: null })
    mockSb.queue('profiles', 'update', { data: {}, error: null })

    const res = await PATCH(buildRequest({
      method: 'PATCH',
      body: { user_id: 'u1', action: 'approve' },
    }))
    expect(res.status).toBe(200)
    const j = await res.json()
    expect(j.status).toBe('verified')

    // Ledger event fired with correct shape
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'kyc.approved',
      actorId: TEST_USERS.adminUser.id,
    }))
  })

  it('admin can reject with reason', async () => {
    loginAs(TEST_USERS.adminUser)
    mockSb.queue('kyc_submissions', 'update', { data: {}, error: null })
    mockSb.queue('profiles', 'update', { data: {}, error: null })

    const res = await PATCH(buildRequest({
      method: 'PATCH',
      body: { user_id: 'u1', action: 'reject', rejection_reason: 'Blurry document' },
    }))
    expect(res.status).toBe(200)

    const subUpdate = mockSb.lastWrite('kyc_submissions')
    expect(subUpdate.status).toBe('rejected')
    expect(subUpdate.rejection_reason).toBe('Blurry document')
  })

  it('reject without reason → 400', async () => {
    loginAs(TEST_USERS.adminUser)
    const res = await PATCH(buildRequest({
      method: 'PATCH',
      body: { user_id: 'u1', action: 'reject' },
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/rejection_reason is required/i)
  })

  it('unknown action → 400', async () => {
    loginAs(TEST_USERS.adminUser)
    const res = await PATCH(buildRequest({
      method: 'PATCH',
      body: { user_id: 'u1', action: 'lol' },
    }))
    expect(res.status).toBe(400)
  })

  it('TC-07-03 :: regular user blocked even with valid body', async () => {
    loginAs(TEST_USERS.ravi)
    const res = await PATCH(buildRequest({
      method: 'PATCH',
      body: { user_id: 'u1', action: 'approve' },
    }))
    expect(res.status).toBe(403)
  })
})
