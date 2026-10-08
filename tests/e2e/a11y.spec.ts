import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import {
  allerALaMarque,
  choisirPersonnageSiDemande,
  commencer,
  jouerJusquAuMiniJeu,
  jouerMission,
  ouvrirNotification,
  tabJusquaSelecteur,
} from './helpers'

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
  await ouvrirNotification(page)
  await page.locator('[data-qualite="aide"]').click()
  await expect(page.getByRole('heading', { name: 'Et alors, que se passe-t-il ?' })).toBeVisible()
  await verifierA11y(page, 'conséquence')
  await jouerMission(page)
  await verifierA11y(page, 'fin de mission')
})

test('mode classe entière (grands textes)', async ({ page }) => {
  await commencer(page, '6e', 'Classe entière')
  await page.getByRole('link', { name: 'Le colis mystère' }).click()
  await verifierA11y(page, 'situation classe')
  await ouvrirNotification(page)
  await page.locator('[data-qualite="aide"]').click()
  await page.getByRole('button', { name: 'Valider le choix de la classe' }).click()
  await expect(page.getByRole('heading', { name: 'Et alors, que se passe-t-il ?' })).toBeVisible()
  await verifierA11y(page, 'conséquence classe')
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
  await ouvrirNotification(page)
  await page.locator('[data-choix="clic"]').click()
  await expect(page.getByRole('heading', { name: 'Qu’est-ce qui t’a donné envie de le faire ?' })).toBeVisible()
  await verifierA11y(page, 'pourquoi')
  await page.locator('[data-levier="autre"]').click()
  await verifierA11y(page, 'conséquence après piège')
})

test('verdict piège affiché', async ({ page }) => {
  await page.goto('/#/mission/p-6e-colis')
  await ouvrirNotification(page)
  await page.locator('[data-choix="clic"]').click()
  await expect(page.locator('figure[data-verdict="piege"]')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ce qui devait t’alerter' })).toBeVisible()
  await verifierA11y(page, 'verdict piège')
})

test('verdict bon réflexe affiché', async ({ page }) => {
  await page.goto('/#/mission/p-6e-colis')
  await ouvrirNotification(page)
  await page.locator('[data-qualite="aide"]').click()
  await expect(page.locator('figure[data-verdict="bon"]')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ce qui devait t’alerter' })).toBeVisible()
  await verifierA11y(page, 'verdict bon réflexe')
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
    await ouvrirNotification(page)
    await expect(page.locator('[data-choix]').first()).toBeVisible()
    await verifierA11y(page, nom)
  })
}

test('téléphone mail et choix joué', async ({ page }) => {
  await page.goto('/#/mission/p-6e-colis')
  await ouvrirNotification(page)
  await page.locator('[data-qualite="aide"]').click()
  await expect(page.locator('.choix-joue')).toContainText('demander de l’aide')
  await verifierA11y(page, 'choix joué')
  // Le mail est le 3e scénario de p-6e-colis (sms, chat, puis mail).
  const mail = page.locator('figure[data-app="mail"]')
  for (let i = 0; i < 3 && !(await mail.isVisible()); i++) {
    if (i > 0) await page.locator('[data-qualite="aide"]').click()
    await page.getByRole('button', { name: 'Continuer', exact: true }).click()
    await ouvrirNotification(page)
    await expect(page.locator('[data-choix]').first()).toBeVisible()
  }
  await expect(mail).toBeVisible()
  await verifierA11y(page, 'téléphone mail')
})

test('écran verrouillé d’entrée et écran d’accueil', async ({ page }) => {
  await page.goto('/#/mission/p-6e-colis')
  await expect(page.locator('[data-notification]')).toBeVisible()
  await verifierA11y(page, 'écran verrouillé d’entrée')
  await ouvrirNotification(page)
  await page.getByRole('button', { name: 'Revenir à l’écran d’accueil' }).click()
  // Appli inactive : `aria-disabled`, que Playwright refuse de cliquer sans `force`.
  await page.locator('[data-appli="Météo"]').click({ force: true })
  await expect(page.getByText('Météo : pas disponible dans ce scénario', { exact: true })).toBeVisible()
  await verifierA11y(page, 'écran d’accueil')
})

/** Une mission réelle par marque du contenu, jouée au clavier jusqu’au verdict : coque (`data-marque`) et mission. */
for (const [nom, marque, id] of [
  ['Messages', 'messages', 'p-6e-colis'],
  ['SnapTalk (conversation)', 'snaptalk', 'c-college-compte-vole'],
  ['SnapTalk (publication)', 'snaptalk', 'v-college-story'],
  ['ChatCord', 'chatcord', 'c-6e-mot-de-passe'],
  ['StreamTube', 'streamtube', 'd-college-hors-contexte'],
  ['Revendo', 'revendo', 'j-lycee-vestiaire'],
  ['GameBox Chat', 'gamebox', 'j-6e-generateur'],
  ['Mail', 'mail', 'p-college-ami-pirate'],
  ['Navigateur', 'navigateur', 'a-college-hors-store'],
  // Page web de BanqueNova (3e scénario) : elle s’ouvre dans la coque du navigateur.
  ['BanqueNova', 'navigateur', 'p-lycee-offre-emploi'],
  ['Magasin d’applis', 'magasin', 'a-6e-lampe-torche'],
] as const) {
  for (const [verdict, qualite, libelle] of [
    ['piege', 'risque', 'verdict piège'],
    ['bon', 'bon', 'bon réflexe'],
  ] as const) {
    test(`marque ${nom} : ${libelle}`, async ({ page }) => {
      await page.goto(`/#/mission/${id}`)
      await allerALaMarque(page, marque)
      await tabJusquaSelecteur(page, `[data-qualite="${qualite}"]`)
      await page.keyboard.press('Enter')
      await expect(page.locator(`[data-marque="${marque}"]`).first()).toBeAttached()
      await expect(page.locator(`figure[data-verdict="${verdict}"]`)).toBeVisible()
      await verifierA11y(page, `${nom}, ${libelle}`)
    })
  }
}

test('mouvement réduit : séquence de retour jusqu’au verdict', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#/mission/p-6e-colis')
  await allerALaMarque(page, 'messages')
  await verifierA11y(page, 'appli ouverte, mouvement réduit')
  await tabJusquaSelecteur(page, '[data-qualite="risque"]')
  await page.keyboard.press('Enter')
  await expect(page.locator('figure[data-verdict="piege"]')).toBeVisible()
  await verifierA11y(page, 'verdict piège, mouvement réduit')
})

for (const id of ['r-college', 'r-lycee'] as const) {
  test(`fil de notifications ${id} (ENT, Météo, BanqueNova, Revendo)`, async ({ page }) => {
    await page.goto(`/#/mission/${id}`)
    await expect(page.locator('[data-notif]').first()).toBeVisible()
    await verifierA11y(page, `fil ${id}`)
  })
}

test('atelier : choix de la marque, verdict, puis « Réinitialiser » reverrouille', async ({ page }) => {
  await page.goto('/#/atelier-telephone')
  await page.getByLabel('Marque').selectOption({ label: 'Revendo' })
  await page.getByLabel('Entrée par notification').check()
  await ouvrirNotification(page)
  await expect(page.locator('[data-marque="revendo"]')).toBeAttached()
  await page.locator('[data-qualite="risque"]').click()
  await expect(page.locator('figure[data-verdict="piege"]')).toBeVisible()
  await verifierA11y(page, 'atelier, verdict piège')
  await page.getByRole('button', { name: 'Réinitialiser' }).click()
  await expect(page.locator('[data-notification]')).toBeVisible()
  await verifierA11y(page, 'atelier, réinitialisé')
})

test('écran verrouillé avec une notification ouverte', async ({ page }) => {
  await page.goto('/#/mission/r-6e')
  await page.locator('[data-notif]').first().click()
  await verifierA11y(page, 'notification ouverte')
})
