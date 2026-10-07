import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { commencer, ouvrirIle } from './helpers'

async function verifierA11y(page: Page, ecran: string) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const graves = r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
  expect(graves.map((v) => `${ecran} — ${v.id} : ${v.help} (${v.nodes.length})`)).toEqual([])
}

for (const schema of ['light', 'dark'] as const) {
  test.describe(`archipel en ${schema}`, () => {
    test.use({ colorScheme: schema })
    test.beforeEach(({ browserName }) => test.skip(browserName !== 'chromium', 'audit axe sous Chromium'))
    test('carte et île sans violation grave', async ({ page }) => {
      await commencer(page, '6e', 'Solo')
      await verifierA11y(page, `archipel ${schema}`)
      await ouvrirIle(page, 'Île aux hameçons')
      await verifierA11y(page, `île ${schema}`)
    })
  })
}

test('au clavier : Tab jusqu’à une île, Entrée, puis une mission', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit ne place pas les liens dans l’ordre de tabulation par défaut (réglage Safari)')
  await commencer(page, '6e', 'Solo')
  const ile = page.getByRole('link', { name: /^Île aux hameçons/ })
  for (let i = 0; i < 40 && !(await ile.evaluate((e) => e === document.activeElement)); i++) await page.keyboard.press('Tab')
  await expect(ile).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Île aux hameçons', level: 1 })).toBeVisible()
})

test('ordre des îles = chemin conseillé puis lagon', async ({ page }) => {
  await commencer(page, '6e', 'Solo')
  const ordre = await page.locator('a.ile-lien').evaluateAll((as) => as.map((a) => a.getAttribute('data-theme')))
  expect(ordre).toEqual(['phishing', 'comptes', 'vie-privee', 'jeux-achats', 'desinformation', 'appareils', 'harcelement', 'rencontres'])
})

test.describe('téléphone', () => {
  test.use({ viewport: { width: 390, height: 844 } })
  test('aucun défilement horizontal, vue liste disponible', async ({ page }) => {
    await commencer(page, '6e', 'Solo')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.getByRole('button', { name: 'Vue liste' }).click()
    await expect(page.getByRole('button', { name: 'Vue liste' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('link', { name: 'Le colis mystère' })).toBeVisible()
  })
})
