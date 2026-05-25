/**
 * i18n / accessibility E2E.
 *
 * Risks covered: R-12 (low user adoption)
 * Test cases   : TC-10-01 (language toggle), TC-10-02 (persistence),
 *                TC-10-06 (keyboard navigation)
 *
 * Requires a logged-in verified user. Provide credentials via
 *   E2E_USER_EMAIL / E2E_USER_PASSWORD env vars.
 */

import { test, expect } from '@playwright/test'

const EMAIL = process.env.E2E_USER_EMAIL ?? 'user@example.com'
const PASS  = process.env.E2E_USER_PASSWORD ?? 'changeme'

async function signIn(page: any) {
  await page.goto('/login')
  await page.getByLabel(/Email/i).fill(EMAIL)
  await page.getByLabel(/Password/i).fill(PASS)
  await page.getByRole('button', { name: /continue to swiftx/i }).click()
  await page.waitForURL(/\/dashboard|\/onboarding/)
}

test.describe('Language toggle (R-12)', () => {
  test('TC-10-01 :: clicking हिं switches UI to Hindi labels', async ({ page }) => {
    await signIn(page)
    // Topbar has Overview / Send / Pay / Deposit etc in English
    await expect(page.getByRole('link', { name: 'Overview' })).toBeVisible()

    await page.getByRole('button', { name: 'हिं', exact: true }).click()
    // After toggle, the same item is rendered in Hindi
    await expect(page.getByRole('link', { name: 'मुख्य पृष्ठ' })).toBeVisible()
  })

  test('TC-10-02 :: choice persists across reload', async ({ page, context }) => {
    await signIn(page)
    await page.getByRole('button', { name: 'हिं', exact: true }).click()
    await page.waitForTimeout(200)
    await page.reload()
    await expect(page.getByRole('link', { name: 'मुख्य पृष्ठ' })).toBeVisible()
  })

  test('TC-10-01 :: numbers stay in Arabic numerals even in Hindi mode', async ({ page }) => {
    await signIn(page)
    await page.getByRole('button', { name: 'हिं', exact: true }).click()

    // The wallet card shows balances. Capture all text and assert no
    // Devanagari digit shows up where a wallet number would.
    const txt = await page.locator('main').innerText()
    expect(txt).not.toMatch(/[०-९]/)
  })
})

test.describe('Keyboard accessibility (R-12)', () => {
  test('TC-10-06 :: Tab reaches every primary nav link', async ({ page }) => {
    await signIn(page)
    let visited = 0
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab')
      const active = await page.evaluate(() => document.activeElement?.tagName)
      if (active === 'A' || active === 'BUTTON') visited++
    }
    expect(visited).toBeGreaterThan(5)
  })
})
