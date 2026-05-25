/**
 * Auth & KYC routing E2E.
 *
 * Risks covered: R-04 (auth flow correctness), R-12 (smooth onboarding)
 * Test cases   : TC-01-01, TC-01-08, TC-01-09
 *
 * Requires a clean test Supabase project. Register a brand-new email
 * each run (timestamp suffix).
 */

import { test, expect } from '@playwright/test'

const stamp = () => Date.now().toString(36)

test.describe('Auth gating (R-04)', () => {
  test('TC-01-08 :: unauthenticated /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('TC-01-08 :: unauthenticated /onboarding/kyc redirects to /login', async ({ page }) => {
    await page.goto('/onboarding/kyc')
    await expect(page).toHaveURL(/\/login/)
  })

  test('TC-01-08 :: unauthenticated /admin redirects to /login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('TC-01-01 :: brand-new registration lands on KYC wizard, not dashboard', async ({ page }) => {
    const email = `e2e-${stamp()}@example.com`

    await page.goto('/register')
    await page.getByLabel(/Full name/i).fill('E2E Tester')
    await page.getByLabel(/Email address/i).fill(email)
    await page.getByLabel(/Create a password/i).fill('TestPass#2026')
    await page.getByRole('button', { name: /create my swiftx account/i }).click()

    // Server redirects to /login?registered=1 (no auto-sign-in)
    await expect(page).toHaveURL(/\/login/)

    // Sign in immediately after register
    await page.getByLabel(/Email/i).fill(email)
    await page.getByLabel(/Password/i).fill('TestPass#2026')
    await page.getByRole('button', { name: /continue to swiftx/i }).click()

    // Must land on KYC wizard, NOT /dashboard
    await expect(page).toHaveURL(/\/onboarding\/kyc/)
    await expect(page.getByRole('heading', { name: /complete your kyc/i })).toBeVisible()
  })
})
