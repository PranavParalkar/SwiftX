/**
 * Global Jest setup — runs before each test file.
 *
 * Provides:
 *   • Stub env vars so module-level Supabase / Razorpay / etc. clients
 *     don't crash when imported.
 *   • Web `Request` / `Response` polyfills for Node-env API route tests.
 *   • Silenced noisy console output during tests.
 */

// Node 20+ has Request/Response/fetch globally — no polyfill needed.

// Dummy build-time env (mirrors buildspec / Dockerfile).
process.env.NODE_ENV = (process.env.NODE_ENV ?? 'test') as any
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-service-role-key'
process.env.GROQ_API_KEY ??= 'test-groq-key'
process.env.SERPER_API_KEY ??= 'test-serper-key'
process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ??= 'rzp_test_dummy'
process.env.RAZORPAY_KEY_SECRET ??= 'test-secret'
process.env.RAZORPAY_DEV_MOCK ??= '1'

// Silence noisy console.error inside tests by default. Tests that need
// the messages can re-enable with `jest.spyOn(console, 'error')`.
const origErr = console.error
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (process.env.JEST_VERBOSE === '1') origErr(...args)
  })
})
