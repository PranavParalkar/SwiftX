/**
 * Full KYC submit flow E2E.
 *
 * Test cases: TC-01-05 (submit), TC-01-07 (admin reject + resubmit)
 *
 * Pre-conditions:
 *   • An admin account exists (set role='admin', kyc_status='verified' in DB).
 *   • Provide via env: E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD.
 */

import { test, expect } from '@playwright/test'

const stamp = () => Date.now().toString(36)

test('TC-01-05 :: complete KYC wizard reaches the pending screen', async ({ page }) => {
  const email = `kyc-${stamp()}@example.com`

  await page.goto('/register')
  await page.getByLabel(/Full name/i).fill('KYC Tester')
  await page.getByLabel(/Email address/i).fill(email)
  await page.getByLabel(/Create a password/i).fill('TestPass#2026')
  await page.getByRole('button', { name: /create my swiftx account/i }).click()
  await page.getByLabel(/Email/i).fill(email)
  await page.getByLabel(/Password/i).fill('TestPass#2026')
  await page.getByRole('button', { name: /continue to swiftx/i }).click()
  await expect(page).toHaveURL(/\/onboarding\/kyc/)

  // Step 1 — Personal
  await page.getByLabel(/date of birth/i).fill('1990-04-15')
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 2 — Identity
  await page.getByLabel(/primary id number/i).fill('ABCDE1234F')
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 3 — Address
  await page.getByLabel(/address line 1/i).fill('221B Baker Street')
  await page.getByLabel(/^city$/i).fill('Mumbai')
  await page.getByLabel(/state/i).fill('MH')
  await page.getByLabel(/postal/i).fill('400001')
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 4 — Bank
  await page.getByLabel(/account holder name/i).fill('KYC Tester')
  await page.getByLabel(/account number/i).fill('1234567890')
  await page.getByLabel(/IFSC|SWIFT/i).fill('HDFC0000001')
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 5 — Review + submit
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: /submit for review/i }).click()

  await expect(page).toHaveURL(/\/onboarding\/kyc\/pending/)
  await expect(page.getByRole('heading', { name: /kyc under review/i })).toBeVisible()
})
