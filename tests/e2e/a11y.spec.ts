import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { commencer, jouerMission } from './helpers'

async function verifierA11y(page: Page, ecran: string) {
  const resultat = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const graves = resultat.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
  expect(graves.map((v) => `${ecran} — ${v.id} : ${v.help} (${v.nodes.length})`)).toEqual([])
}

test.beforeEach(({ browserName }) => {
  test.skip(browserName !== 'chromium', 'audit axe exécuté une fois, sous Chromium')
})

test('pages élève', async ({ page }) => {
  await page.goto('/')
  await verifierA11y(page, 'accueil')
  await commencer(page, '6e', 'Solo')
  await verifierA11y(page, 'carte')
  await page.getByRole('link', { name: 'Le colis mystère' }).click()
  await verifierA11y(page, 'situation')
  await page.locator('[data-qualite="aide"]').click()
  await verifierA11y(page, 'indices')
  await page.getByRole('button', { name: 'Je ne sais pas' }).click()
  await verifierA11y(page, 'conséquence')
  await jouerMission(page)
  await verifierA11y(page, 'fin de mission')
})

test('mode classe entière (grands textes)', async ({ page }) => {
  await commencer(page, '6e', 'Classe entière')
  await page.getByRole('link', { name: 'Le colis mystère' }).click()
  await verifierA11y(page, 'situation classe')
  await page.locator('[data-qualite="aide"]').click()
  await page.getByRole('button', { name: 'Valider le choix de la classe' }).click()
  await verifierA11y(page, 'indices classe')
})

test('mission rappel (fil de notifications)', async ({ page }) => {
  await page.goto('/#/mission/r-6e')
  await verifierA11y(page, 'fil')
})

for (const [nom, chemin] of [
  ['enseignants', '/#/enseignants'],
  ['fiche', '/#/enseignants/p-6e-colis'],
  ['plan B', '/#/enseignants/p-6e-colis/plan-b'],
  ['confidentialité', '/#/confidentialite'],
  ['test technique', '/#/test'],
  ['introuvable', '/#/nimporte-quoi'],
] as const) {
  test(`page ${nom}`, async ({ page }) => {
    await page.goto(chemin)
    await verifierA11y(page, nom)
  })
}
