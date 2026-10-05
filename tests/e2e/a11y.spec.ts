import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { commencer, jouerJusquAuMiniJeu, jouerMission } from './helpers'

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
  ['fiche parcours', '/#/enseignants/c-6e-parcours'],
  ['plan B parcours', '/#/enseignants/c-6e-parcours/plan-b'],
  ['confidentialité', '/#/confidentialite'],
  ['test technique', '/#/test'],
  ['introuvable', '/#/nimporte-quoi'],
] as const) {
  test(`page ${nom}`, async ({ page }) => {
    await page.goto(chemin)
    await verifierA11y(page, nom)
  })
}

test('étape « pourquoi » et réponse personnalisée', async ({ page }) => {
  await page.goto('/#/mission/p-6e-colis')
  await page.locator('[data-choix="clic"]').click()
  await verifierA11y(page, 'pourquoi')
  await page.locator('[data-levier="autre"]').click()
  await verifierA11y(page, 'conséquence après piège')
})

for (const [nom, id] of [
  ['mot de passe', 'c-6e-mot-de-passe'],
  ['confidentialité', 'v-6e-photo'],
  ['vérification', 'd-6e-image-ia'],
  ['permissions', 'a-6e-lampe-torche'],
] as const) {
  test(`mini-jeu ${nom}`, async ({ page }) => {
    await page.goto(`/#/mission/${id}`)
    await jouerJusquAuMiniJeu(page)
    await verifierA11y(page, `mini-jeu ${nom}`)
  })
}

test('parcours de l’île : lieu, pourquoi, réaction, récupération et fin', async ({ page }) => {
  await commencer(page, '6e', 'Solo')
  await page.getByRole('link', { name: 'La traversée de l’île des clés' }).click()
  await verifierA11y(page, 'lieu')
  await page.locator('[data-choix="ecrit"]').click()
  await verifierA11y(page, 'pourquoi (lieu)')
  await page.locator('[data-levier="groupe"]').click()
  await verifierA11y(page, 'réaction')
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await verifierA11y(page, 'récupération (lieu)')
  await page.goto('/#/mission/p-6e-parcours')
  await jouerMission(page)
  await verifierA11y(page, 'fin de parcours')
})

test('parcours en classe entière (grands textes)', async ({ page }) => {
  await commencer(page, '6e', 'Classe entière')
  await page.getByRole('link', { name: 'La traversée de l’île aux hameçons' }).click()
  await verifierA11y(page, 'lieu classe')
})
