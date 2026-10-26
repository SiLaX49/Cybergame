import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { commencer, jouerMission, ouvrirMission, ouvrirNotification } from './helpers'

async function verifierA11y(page: Page, ecran: string) {
  const resultat = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const graves = resultat.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
  expect(graves.map((v) => `${ecran} — ${v.id} : ${v.help} (${v.nodes.length})`)).toEqual([])
}

async function choisirTheme(page: Page, theme: 'Clair' | 'Sombre') {
  await page.getByRole('button', { name: 'Réglages' }).click()
  await page.getByRole('radio', { name: theme, exact: true }).check()
  await page.getByRole('button', { name: 'Réglages' }).click()
}

const menu = (page: Page) => page.getByRole('navigation', { name: 'Menu principal' })

for (const theme of ['Clair', 'Sombre'] as const) {
  test(`tableau de bord, défis et profil en ${theme.toLowerCase()} : audit axe`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'audit axe exécuté une fois, sous Chromium')
    await commencer(page, '6e', 'Solo')
    await choisirTheme(page, theme)
    await menu(page).getByRole('link', { name: 'Accueil' }).click()
    await expect(page.getByRole('heading', { level: 1, name: /Île aux hameçons/ })).toBeVisible()
    await verifierA11y(page, `accueil ${theme}`)
    await menu(page).getByRole('link', { name: 'Défis' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Défis' })).toBeVisible()
    await verifierA11y(page, `défis ${theme}`)
    await menu(page).getByRole('link', { name: 'Profil' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Ton profil' })).toBeVisible()
    await verifierA11y(page, `profil ${theme}`)
  })
}

test('une mission rapporte des octets, dépensés ensuite à la boutique', async ({ page }) => {
  await commencer(page, '6e', 'Solo')
  await expect(page.locator('.reserve')).toContainText('0 octet')
  await ouvrirMission(page, 'Île aux hameçons', 'Le colis mystère')
  await ouvrirNotification(page)
  await page.locator('[data-qualite="aide"]').click()
  await jouerMission(page)
  await expect(page.getByRole('heading', { name: 'Tes octets' })).toBeVisible()
  await expect(page.getByText('ajoutés à ta réserve')).toBeVisible()
  await page.goto('/#/profil')
  await expect(page.locator('.reserve')).not.toContainText(/^\s*Ta réserve : 0 octet/)
  const article = page.locator('.article', { hasText: 'Apprenti·e prudent·e' })
  await article.getByRole('button', { name: /Acheter/ }).click()
  await expect(page.locator('.titre-porte')).toHaveText('Apprenti·e prudent·e')
})

test('tableau de bord à 320 px : aucun défilement horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await commencer(page, '6e', 'Solo')
  for (const chemin of ['/#/', '/#/defis', '/#/profil']) {
    await page.goto(chemin)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const deborde = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(deborde, chemin).toBe(false)
  }
})
