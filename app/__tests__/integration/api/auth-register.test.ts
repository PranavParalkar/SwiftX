/**
 * /api/auth/register integration tests.
 *
 * Risks covered: R-04 (PII), R-03 (Supabase outage)
 * Test cases   : TC-01-01, TC-01-02, TC-07-04, TC-07-05
 */

import { createMockSupabase, MockSupabase } from '../../helpers/supabaseMock'
import { buildRequest } from '../../helpers/nextRequest'

let mockSb: MockSupabase
jest.mock('@/lib/supabase/admin', () => {
  const { createMockSupabase } = require('../../helpers/supabaseMock')
  mockSb = createMockSupabase()
  return { adminClient: mockSb }
})

import { POST } from '@/app/api/auth/register/route'

const newAuthUser = { id: 'auth-uuid-new', email: 'new@example.com' }

beforeEach(() => {
  mockSb.resetQueues()
  jest.clearAllMocks()
  ;(mockSb.auth.admin.createUser as jest.Mock).mockResolvedValue({
    data: { user: newAuthUser }, error: null,
  })
  ;(mockSb.auth.admin.deleteUser as jest.Mock).mockResolvedValue({ error: null })
})

describe('POST /api/auth/register', () => {
  it('TC-01-01 :: succeeds with valid payload and returns rm_id', async () => {
    mockSb.queue('profiles', 'insert', {
      data: { rm_id: 'SX12345', email: 'new@example.com' },
      error: null,
    })

    const req = buildRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/auth/register',
      body: {
        email: 'new@example.com',
        password: 'StrongPass#1',
        full_name: 'New Member',
        phone: '+919999999999',
      },
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.rm_id).toBe('SX12345')
    expect(body.email).toBe('new@example.com')

    // Verify the profile insert payload doesn't contain `name` (the bug we fixed earlier)
    const inserted = mockSb.lastWrite('profiles')
    expect(inserted).toHaveProperty('full_name')
    expect(inserted).not.toHaveProperty('name')
  })

  it.each([
    [{ email: '', password: 'x', full_name: 'X' }, 'email'],
    [{ email: 'a@b.c', password: '', full_name: 'X' }, 'password'],
    [{ email: 'a@b.c', password: 'x', full_name: '' }, 'full_name'],
  ])('rejects when required field missing: %j', async (body) => {
    const req = buildRequest({ method: 'POST', body })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const j = await res.json()
    expect(j.error).toMatch(/Missing required/i)
  })

  it('TC-01-02 :: surfaces Supabase auth error without creating profile', async () => {
    ;(mockSb.auth.admin.createUser as jest.Mock).mockResolvedValueOnce({
      data: null, error: { message: 'User already registered' },
    })

    const req = buildRequest({
      method: 'POST',
      body: { email: 'dup@example.com', password: 'x', full_name: 'Y' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const j = await res.json()
    expect(j.error).toMatch(/already registered/i)
    // No profile insert should have been attempted
    expect(mockSb.from).not.toHaveBeenCalledWith('profiles')
  })

  it('rolls back the auth user when profile insert fails', async () => {
    mockSb.queue('profiles', 'insert', {
      data: null, error: { message: 'constraint violation' },
    })

    const req = buildRequest({
      method: 'POST',
      body: { email: 'rb@example.com', password: 'p', full_name: 'Rollback' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    // Critical: auth user must be deleted to avoid orphaned auth.users rows
    expect(mockSb.auth.admin.deleteUser).toHaveBeenCalledWith(newAuthUser.id)
  })

  it('TC-07-05 :: XSS payload in full_name is passed through (stored only — display sanitises)', async () => {
    mockSb.queue('profiles', 'insert', {
      data: { rm_id: 'SX55555', email: 'xss@example.com' }, error: null,
    })

    const xss = '<script>alert("xss")</script>'
    const req = buildRequest({
      method: 'POST',
      body: { email: 'xss@example.com', password: 'p', full_name: xss },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)

    // The full_name is stored verbatim. React's default JSX escaping
    // ensures the string is rendered as text, never executed. We assert
    // the database insert simply contains the raw string — the UI test
    // (see TC-07-05 in E2E) confirms no <script> tag reaches the DOM.
    const inserted = mockSb.lastWrite('profiles')
    expect(inserted.full_name).toBe(xss)
  })
})
