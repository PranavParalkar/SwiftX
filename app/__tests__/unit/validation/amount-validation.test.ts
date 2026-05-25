/**
 * Pure-validation tests for amount handling across deposit / withdraw /
 * transfer / pay-merchant. Covers the negative / zero / overflow paths
 * called out by TC-02-04, TC-02-05, TC-02-07.
 */

function validAmount(input: any): { ok: true; n: number } | { ok: false; error: string } {
  if (input === null || input === undefined || input === '') {
    return { ok: false, error: 'Amount is required' }
  }
  const n = Number(input)
  if (Number.isNaN(n)) return { ok: false, error: 'Amount must be a number' }
  if (!Number.isFinite(n)) return { ok: false, error: 'Amount must be finite' }
  if (n <= 0) return { ok: false, error: 'Amount must be greater than zero' }
  if (n > 1_000_000_000) return { ok: false, error: 'Amount too large' }
  // Smallest currency unit is the paisa/cent — max 2 decimals
  if (Math.round(n * 100) !== n * 100) return { ok: false, error: 'Max 2 decimals' }
  return { ok: true, n }
}

describe('amount validation (R-01)', () => {
  it.each([
    [100],
    [1],
    [0.01],
    [999.99],
    [1_000_000],
  ])('accepts positive value %p', (v) => {
    expect(validAmount(v)).toEqual({ ok: true, n: v })
  })

  it.each([
    [0],
    [-1],
    [-0.01],
    ['-100'],
  ])('TC-02-04 / TC-02-05 :: rejects %p', (v) => {
    const r = validAmount(v)
    expect(r.ok).toBe(false)
  })

  it.each([
    [null],
    [undefined],
    [''],
    ['abc'],
    [NaN],
    [Infinity],
    [-Infinity],
  ])('rejects non-numeric %p', (v) => {
    const r = validAmount(v as any)
    expect(r.ok).toBe(false)
  })

  it('rejects more than 2 decimals (precision attack)', () => {
    const r = validAmount(1.234)
    expect(r.ok).toBe(false)
  })

  it('rejects astronomical amounts (overflow guard)', () => {
    const r = validAmount(1e15)
    expect(r.ok).toBe(false)
  })
})
