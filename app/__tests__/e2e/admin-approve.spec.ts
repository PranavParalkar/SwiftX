/**
 * Admin KYC approve → user dashboard access E2E.
 *
 * Test cases: TC-01-05 (full happy path), TC-07-03 (admin role gates)
 *
 * Env: E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD.
 */

import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@swiftx.app'
const ADMIN_PASS  = process.env.E2E_ADMIN_PASSWORD ?? 'SwiftXAdmin@2026'

test('TC-07-03 :: admin sees pending KYC queue', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/Email/i).fill(ADMIN_EMAIL)
  await page.getByLabel(/Password/i).fill(ADMIN_PASS)
  await page.getByRole('button', { name: /continue to swiftx/i }).click()

  await expect(page).toHaveURL(/\/admin/)
  await page.goto('/admin/kyc')
  await expect(page.getByRole('heading', { name: /kyc review queue/i })).toBeVisible()
})

test('TC-07-03 :: non-admin /admin redirects to /dashboard (then /onboarding)', async ({ page }) => {
  // Sign in as a non-admin (verified) user. Provide via env.
  const email = process.env.E2E_USER_EMAIL
  const pass  = process.env.E2E_USER_PASSWORD
  test.skip(!email || !pass, 'requires E2E_USER_EMAIL / E2E_USER_PASSWORD')

  await page.goto('/login')
  await page.getByLabel(/Email/i).fill(email!)
  await page.getByLabel(/Password/i).fill(pass!)
  await page.getByRole('button', { name: /continue to swiftx/i }).click()

  await page.goto('/admin/kyc')
  // Non-admin gets bounced to /dashboard (and possibly to /onboarding if unverified)
  await expect(page).toHaveURL(/\/dashboard|\/onboarding/)
})
