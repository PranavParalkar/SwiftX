/**
 * Unit tests for lib/forex.ts
 *
 * Risks covered: R-01 (rate accuracy), R-07 (third-party outage), R-11 (cost)
 * Test cases   : TC-04-01..05, TC-02-04, TC-02-05, TC-03-02, TC-03-03
 */

import { createMockSupabase, MockSupabase } from '../../helpers/supabaseMock'

let mockSb: MockSupabase

jest.mock('@/lib/supabase/admin', () => {
  const { createMockSupabase } = require('../../helpers/supabaseMock')
  mockSb = createMockSupabase()
  return { adminClient: mockSb }
})

// Mock axios at the module level so getLiveRate's external call never runs.
jest.mock('axios', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}))
import axios from 'axios'
const mockedAxiosGet = (axios as any).get as jest.Mock

import {
  getLiveRate, getConversionQuote, RAZORPAY_FEE_RATE, DEFAULT_BANK_FEE_RATE, CURRENCIES,
} from '@/lib/forex'

describe('lib/forex.getLiveRate — cache + fallback (R-07)', () => {
  beforeEach(() => {
    mockSb.resetQueues()
    jest.clearAllMocks()
    // Wipe the module's in-memory cache by re-requiring the module.
    jest.resetModules()
  })

  it('TC-04-01 :: cache hit returns DB rate without calling external API', async () => {
    // Fresh fetched_at → within 5-min TTL
    mockSb.queue('exchange_rates', 'select', {
      data: { rate: 83.45, fetched_at: new Date().toISOString() },
      error: null,
    })
    const rate = await getLiveRate('USD', 'INR')
    expect(rate).toBeCloseTo(83.45, 4)
    expect(mockedAxiosGet).not.toHaveBeenCalled()
  })

  it('TC-04-03 :: external API down → hardcoded fallback is used', async () => {
    mockSb.queue('exchange_rates', 'select', { data: null, error: null })
    mockSb.queue('exchange_rates', 'upsert', { data: {}, error: null })
    mockedAxiosGet.mockRejectedValueOnce(new Error('503 Service Unavailable'))

    const rate = await getLiveRate('USD', 'INR')
    // Fallback for USD→INR ≈ 85.80
    expect(rate).toBeGreaterThan(80)
    expect(rate).toBeLessThan(95)
  })

  it('base === target returns 1 without any I/O', async () => {
    const r = await getLiveRate('USD', 'USD')
    expect(r).toBe(1)
    expect(mockSb.from).not.toHaveBeenCalled()
    expect(mockedAxiosGet).not.toHaveBeenCalled()
  })
})

describe('lib/forex.getConversionQuote — fee model + math (R-01)', () => {
  // Pin the rate so we test the math, not the network.
  beforeEach(() => {
    mockSb.resetQueues()
    mockSb.queue('exchange_rates', 'select', {
      data: { rate: 83.0, fetched_at: new Date().toISOString() },
      error: null,
    })
  })

  it('TC-03-02 :: recipient receives amount * rate (no fee subtracted upstream)', async () => {
    const q = await getConversionQuote('USD', 'INR', 100, 0.0035)
    expect(q.rate).toBe(83)
    expect(q.converted).toBeCloseTo(8300, 4)
  })

  it('TC-03-03 :: razorpay fee is exactly 2% of source amount', async () => {
    const q = await getConversionQuote('USD', 'INR', 250, 0.0035)
    expect(q.razorpay_fee).toBeCloseTo(250 * RAZORPAY_FEE_RATE, 2)  // 5.00
  })

  it('bank fee scales with the per-account rate', async () => {
    const a = await getConversionQuote('USD', 'INR', 1000, 0.0025)
    const b = await getConversionQuote('USD', 'INR', 1000, 0.0052)
    expect(b.bank_fee).toBeGreaterThan(a.bank_fee)
    expect(a.bank_fee).toBeCloseTo(1000 * 0.0025, 2)  // 2.50
    expect(b.bank_fee).toBeCloseTo(1000 * 0.0052, 2)  // 5.20
  })

  it('combined fee = razorpay_fee + bank_fee (within 1 cent rounding)', async () => {
    const q = await getConversionQuote('USD', 'INR', 999.99, 0.004)
    expect(q.fee).toBeCloseTo(q.razorpay_fee + q.bank_fee, 2)
  })

  it('uses default bank-fee rate when not provided', async () => {
    const q = await getConversionQuote('USD', 'INR', 1000)
    expect(q.bank_fee).toBeCloseTo(1000 * DEFAULT_BANK_FEE_RATE, 2)
  })
})

describe('lib/forex — currency catalogue', () => {
  it('exports a non-empty currency map including the demo majors', () => {
    expect(Object.keys(CURRENCIES).length).toBeGreaterThan(40)
    expect(CURRENCIES['INR']).toBeDefined()
    expect(CURRENCIES['USD']).toBeDefined()
    expect(CURRENCIES['AED']).toBeDefined()
  })
})
