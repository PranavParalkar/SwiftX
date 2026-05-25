/**
 * k6 load test for /api/transfer
 *
 * Risks covered: R-05 (performance under load)
 * Test cases   : TC-09-01 (50 VU, p95 ≤ 2s, error rate < 0.1%)
 *                TC-09-04 (500 VU stress — see scenarios.stress)
 *
 * Run:
 *   k6 run __tests__/load/transfer.k6.js \
 *     --env BASE_URL=http://localhost:3000 \
 *     --env AUTH_COOKIE='sb-access-token=...'
 *
 * Get the cookie from a logged-in browser session: DevTools → Application
 * → Cookies → copy the `sb-access-token` value.
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend, Rate } from 'k6/metrics'

const transferLatency = new Trend('transfer_latency', true)
const transferErrors  = new Rate('transfer_errors')

export const options = {
  scenarios: {
    // TC-09-01: 50 VUs for 60 s
    nominal: {
      executor: 'constant-vus',
      vus: 50,
      duration: '60s',
      exec: 'doTransfer',
      tags: { scenario: 'nominal' },
    },
    // TC-09-04: 500 VU stress (commented out — uncomment when you have a load env)
    // stress: {
    //   executor: 'ramping-vus',
    //   startVUs: 0,
    //   stages: [
    //     { duration: '30s', target: 200 },
    //     { duration: '60s', target: 500 },
    //     { duration: '30s', target: 0 },
    //   ],
    //   exec: 'doTransfer',
    //   tags: { scenario: 'stress' },
    // },
  },
  thresholds: {
    'http_req_failed':                ['rate<0.001'],   // < 0.1%
    'transfer_latency':               ['p(95)<2000'],   // p95 ≤ 2s
    'http_req_duration{scenario:nominal}': ['p(95)<2000'],
  },
}

const BASE_URL    = __ENV.BASE_URL    || 'http://localhost:3000'
const AUTH_COOKIE = __ENV.AUTH_COOKIE || ''
const RECIPIENT   = __ENV.RECIPIENT_RM_ID || 'SX10002'

export function doTransfer() {
  const body = JSON.stringify({
    recipient: RECIPIENT,
    source_currency: 'INR',
    target_currency: 'USD',
    amount: '1',                         // small to avoid balance exhaustion
    note: `k6 ${__VU}-${__ITER}`,
  })

  const res = http.post(`${BASE_URL}/api/transfer`, body, {
    headers: { 'Content-Type': 'application/json', Cookie: AUTH_COOKIE },
    tags: { name: 'POST /api/transfer' },
  })

  transferLatency.add(res.timings.duration)
  transferErrors.add(res.status >= 400)

  check(res, {
    'status is 201 or 400 (balance)': r => r.status === 201 || r.status === 400,
    'duration < 3 s':                  r => r.timings.duration < 3000,
  })

  sleep(0.2 + Math.random() * 0.4)       // think-time
}
