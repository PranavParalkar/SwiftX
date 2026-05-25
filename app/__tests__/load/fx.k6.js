/**
 * k6 load test for /api/forex (cache hit path).
 *
 * Test case: TC-09-02 — 100 requests, p95 ≤ 200 ms, cache hit ratio
 */

import http from 'k6/http'
import { check } from 'k6'
import { Trend } from 'k6/metrics'

const latency = new Trend('fx_latency', true)

export const options = {
  vus: 20,
  iterations: 100,
  thresholds: {
    'fx_latency':       ['p(95)<200'],   // TC-09-02 threshold
    'http_req_failed':  ['rate<0.001'],
  },
}

const BASE_URL    = __ENV.BASE_URL    || 'http://localhost:3000'
const AUTH_COOKIE = __ENV.AUTH_COOKIE || ''

export default function () {
  const res = http.get(`${BASE_URL}/api/forex?base=INR&target=USD`, {
    headers: { Cookie: AUTH_COOKIE },
    tags: { name: 'GET /api/forex' },
  })
  latency.add(res.timings.duration)
  check(res, {
    'status 200': r => r.status === 200,
    'has rate field': r => !!JSON.parse(r.body).rate,
  })
}
