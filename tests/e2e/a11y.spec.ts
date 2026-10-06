import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { choisirPersonnageSiDemande, commencer, jouerJusquAuMiniJeu, jouerMission } from './helpers'

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
  await verifierA11y(page, 'choix du personnage')
  await choisirPersonnageSiDemande(page)
  await verifierA11y(page, 'lieu')
  await page.locator('[data-choix="ecrit"]').click()
  await verifierA11y(page, 'pourquoi (lieu)')
  await page.locator('[data-levier="groupe"]').click()
  await verifierA11y(page, 'réaction')
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await verifierA11y(page, 'récupération (lieu)')
  await page.getByRole('button', { name: /Paramètres/ }).click()
  await page.getByRole('button', { name: /Sécurité et connexion/ }).click()
  await page.getByLabel('Nouveau mot de passe').fill('tortue-rouge-sous-nuage')
  await page.getByLabel(/Déconnecter tous les autres appareils/).check()
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await expect(page.locator('.rester')).toBeVisible()
  await verifierA11y(page, 'retour au même lieu, choix barré')
  await page.goto('/#/mission/p-6e-parcours')
  await choisirPersonnageSiDemande(page)
  await jouerMission(page)
  await verifierA11y(page, 'fin de parcours')
})

test('parcours en classe entière (grands textes)', async ({ page }) => {
  await commencer(page, '6e', 'Classe entière')
  await page.getByRole('link', { name: 'La traversée de l’île aux hameçons' }).click()
  await choisirPersonnageSiDemande(page)
  await verifierA11y(page, 'lieu classe')
})

test('parcours : écran « Choisis ton personnage » et scène du premier lieu', async ({ page }) => {
  await page.goto('/#/mission/v-6e-parcours')
  await expect(page.getByText('Choisis ton personnage')).toBeVisible()
  await verifierA11y(page, 'choix du personnage')
  await choisirPersonnageSiDemande(page)
  await expect(page.locator('.parcours-scene')).toBeVisible()
  await verifierA11y(page, 'scène du premier lieu')
})

for (const [nom, id] of [
  ['téléphone sms', 'p-6e-colis'],
  ['téléphone chat', 'p-college-ami-pirate'],
  ['téléphone social', 'd-college-hors-contexte'],
  ['téléphone web', 'a-lycee-wifi-gare'],
] as const) {
  test(nom, async ({ page }) => {
    await page.goto(`/#/mission/${id}`)
    await expect(page.locator('[data-choix]').first()).toBeVisible()
    await verifierA11y(page, nom)
  })
}

test('téléphone mail et choix joué', async ({ page }) => {
  await page.goto('/#/mission/p-6e-colis')
  await page.locator('[data-qualite="aide"]').click()
  await expect(page.locator('.choix-joue')).toContainText('demander de l’aide')
  await verifierA11y(page, 'choix joué')
  // Le mail est le 3e scénario de p-6e-colis (sms, chat, puis mail).
  const mail = page.locator('figure[data-app="mail"]')
  for (let i = 0; i < 3 && !(await mail.isVisible()); i++) {
    if (i > 0) await page.locator('[data-qualite="aide"]').click()
    await page.getByRole('button', { name: 'Je ne sais pas' }).click()
    await page.getByRole('button', { name: 'Continuer', exact: true }).click()
    await expect(page.locator('[data-choix]').first()).toBeVisible()
  }
  await expect(mail).toBeVisible()
  await verifierA11y(page, 'téléphone mail')
})

test('écran verrouillé avec une notification ouverte', async ({ page }) => {
  await page.goto('/#/mission/r-6e')
  await page.locator('[data-notif]').first().click()
  await verifierA11y(page, 'notification ouverte')
})
