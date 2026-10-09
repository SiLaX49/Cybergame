import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { commencer, jouerMission, ouvrirNotification } from './helpers'

async function verifierA11y(page: Page, ecran: string) {
  const resultat = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const graves = resultat.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
  expect(graves.map((v) => `${ecran} — ${v.id} : ${v.help} (${v.nodes.length})`)).toEqual([])
}

const fondSombre = 'rgb(21, 18, 38)'
const fondClair = 'rgb(255, 248, 236)'
const fondPage = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor)

test.describe('mode sombre automatique', () => {
  test.use({ colorScheme: 'dark' })
  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== 'chromium', 'audit axe exécuté une fois, sous Chromium')
  })

  test('pages élève en sombre', async ({ page }) => {
    await page.goto('/')
    expect(await fondPage(page)).toBe(fondSombre)
    await verifierA11y(page, 'accueil sombre')
    await commencer(page, '6e', 'Solo')
    await verifierA11y(page, 'carte sombre')
    await page.getByRole('link', { name: 'Le colis mystère' }).click()
    await verifierA11y(page, 'situation sombre')
    // Le téléphone garde sa palette claire : l’audit vérifie ses contrastes sur le site en sombre.
    await ouvrirNotification(page)
    await verifierA11y(page, 'appli ouverte sombre')
    await page.locator('[data-qualite="aide"]').click()
    await expect(page.getByRole('heading', { name: 'Et alors, que se passe-t-il ?' })).toBeVisible()
    await verifierA11y(page, 'conséquence sombre')
    await jouerMission(page)
    await verifierA11y(page, 'fin de mission sombre')
  })

  for (const [nom, chemin] of [
    ['enseignants', '/#/enseignants'],
    ['fiche', '/#/enseignants/p-6e-colis'],
    ['plan B parcours', '/#/enseignants/c-6e-parcours/plan-b'],
    ['fil', '/#/mission/r-6e'],
    ['introuvable', '/#/nimporte-quoi'],
  ] as const) {
    test(`page ${nom} en sombre`, async ({ page }) => {
      await page.goto(chemin)
      await verifierA11y(page, `${nom} sombre`)
    })
  }
})

test('le réglage Thème force le clair ou le sombre et reste après rechargement', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Réglages' }).click()
  await page.getByRole('radio', { name: 'Clair', exact: true }).check()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'clair')
  expect(await fondPage(page)).toBe(fondClair)
  await page.getByRole('radio', { name: 'Sombre', exact: true }).check()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sombre')
  await page.emulateMedia({ colorScheme: 'light' })
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sombre')
  expect(await fondPage(page)).toBe(fondSombre)
})

test('animations désactivées : les boutons ne bougent pas', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Réglages' }).click()
  await page.getByRole('checkbox', { name: 'Animations' }).uncheck()
  const bouton = page.getByRole('button', { name: 'Réglages' })
  const duree = await bouton.evaluate((b) => getComputedStyle(b).transitionDuration)
  expect(duree.split(',').every((d) => parseFloat(d) === 0)).toBe(true)
})

test.describe('mouvement réduit demandé par l’appareil', () => {
  test.use({ reducedMotion: 'reduce' })
  test('aucune transition sur les boutons', async ({ page }) => {
    await page.goto('/')
    const duree = await page.getByRole('button', { name: 'Réglages' }).evaluate((b) => getComputedStyle(b).transitionDuration)
    expect(duree.split(',').every((d) => parseFloat(d) === 0)).toBe(true)
  })
})
