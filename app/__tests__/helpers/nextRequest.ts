/**
 * Build a NextRequest-shaped Request for handler unit tests.
 *
 * Next 16 route handlers receive a `NextRequest` (extends standard `Request`).
 * For our handlers we only touch `.json()`, `.headers`, and `.nextUrl.searchParams`
 * — so a slim shim is enough. Real `NextRequest` is dragged in from `next/server`
 * which works fine inside ts-jest if needed.
 */
import { NextRequest } from 'next/server'

export interface BuildOpts {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'
  url?: string
  body?: any
  headers?: Record<string, string>
  searchParams?: Record<string, string>
}

export function buildRequest(opts: BuildOpts = {}): NextRequest {
  const method = opts.method ?? 'GET'
  const base = opts.url ?? 'http://localhost:3000/api/test'
  const u = new URL(base)
  if (opts.searchParams) {
    Object.entries(opts.searchParams).forEach(([k, v]) => u.searchParams.set(k, v))
  }
  const init: RequestInit = {
    method,
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'jest',
      ...(opts.headers ?? {}),
    },
  }
  if (opts.body !== undefined && method !== 'GET') {
    init.body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body)
  }
  return new NextRequest(u, init)
}
