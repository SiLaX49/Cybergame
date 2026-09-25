import { expect, test } from '@playwright/test'

test('fonctionne hors ligne après un premier chargement', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'service worker testé sous Chromium')
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Cyber Réflexes', level: 1 })).toBeVisible()
  await page.goto('/#/mission/p-6e-colis')
  await expect(page.getByRole('heading', { name: 'Le colis mystère', level: 1 })).toBeVisible()
})
