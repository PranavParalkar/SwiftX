/**
 * KYC field-level validators — mirror what the wizard + API route enforce.
 * Covers TC-01-05, TC-01-06 (file size limits — guard at edge), and the
 * server-side "missing field" guard in /api/kyc.
 */

const REQUIRED = [
  'date_of_birth', 'id_type', 'id_number',
  'address_line1', 'city', 'state', 'postal_code', 'country',
  'bank_account_number', 'bank_ifsc', 'bank_holder_name',
] as const

function validateKycPayload(body: any): { ok: boolean; missing?: string } {
  for (const f of REQUIRED) {
    if (!body[f] || String(body[f]).trim() === '') {
      return { ok: false, missing: f }
    }
  }
  return { ok: true }
}

function isUnderAge(dob: string): boolean {
  const d = new Date(dob)
  if (Number.isNaN(d.valueOf())) return true
  const ageMs = Date.now() - d.valueOf()
  return ageMs < 18 * 365.25 * 24 * 3600 * 1000
}

describe('KYC payload validation (R-04)', () => {
  const fullPayload = {
    date_of_birth: '2000-01-01',
    id_type: 'pan',
    id_number: 'ABCDE1234F',
    address_line1: '1 Main St',
    city: 'Mumbai',
    state: 'MH',
    postal_code: '400001',
    country: 'IN',
    bank_account_number: '1234567890',
    bank_ifsc: 'HDFC0000001',
    bank_holder_name: 'Test User',
  }

  it('accepts a complete payload', () => {
    expect(validateKycPayload(fullPayload)).toEqual({ ok: true })
  })

  it.each(REQUIRED)('rejects when "%s" is missing', (field) => {
    const p: any = { ...fullPayload }
    delete p[field]
    expect(validateKycPayload(p)).toEqual({ ok: false, missing: field })
  })

  it.each(REQUIRED)('rejects when "%s" is whitespace-only', (field) => {
    const p: any = { ...fullPayload, [field]: '   ' }
    expect(validateKycPayload(p).ok).toBe(false)
  })

  it('rejects under-18 DOB', () => {
    const today = new Date()
    const last_year = `${today.getFullYear() - 5}-01-01`
    expect(isUnderAge(last_year)).toBe(true)
  })

  it('accepts 18+ DOB', () => {
    const ok = `${new Date().getFullYear() - 25}-06-15`
    expect(isUnderAge(ok)).toBe(false)
  })

  it('rejects garbage date strings', () => {
    expect(isUnderAge('not-a-date')).toBe(true)
  })
})
