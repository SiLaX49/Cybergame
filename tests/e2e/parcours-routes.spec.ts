import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { choisirPersonnageSiDemande, commencer, ouvrirMission } from './helpers'

const MISSION = 'L’île aux hameçons : le grand concours'
// Le lieu 2 (« Ta chambre ») est la bifurcation ; « Le CDI » est propre à la route « bon », « Le salon » à la route « aide ».

async function verifierA11y(page: Page, ecran: string) {
  const resultat = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const graves = resultat.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
  expect(graves.map((v) => `${ecran} — ${v.id} : ${v.help} (${v.nodes.length})`)).toEqual([])
}

async function ouvrirParcours(page: Page) {
  await commencer(page, '5e – 3e', 'Solo')
  await ouvrirMission(page, 'Île aux hameçons', MISSION)
  await choisirPersonnageSiDemande(page)
  await expect(page.locator('article.lieu')).toBeVisible()
}

/** Joue un lieu avec la qualité voulue, puis « Continuer » ; sur le dernier lieu, la mission se termine. */
async function jouerLieu(page: Page, qualite: string) {
  await page.locator(`[data-qualite="${qualite}"]`).click()
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
}

for (const route of ['bon', 'aide'] as const) {
  test(`parcours collège : route « ${route} » jusqu’au bout`, async ({ page }) => {
    await ouvrirParcours(page)
    const lieuxVus: string[] = []
    for (let i = 0; i < 5; i++) {
      await expect(page.getByRole('status').filter({ hasText: new RegExp(`Étape ${i + 1} sur 5`) })).toBeVisible()
      lieuxVus.push((await page.locator('[aria-current="step"]').innerText()).trim())
      if (i === 1) {
        // Bifurcation : la suite n’est pas encore connue.
        await expect(page.getByText('selon ton choix').first()).toBeVisible()
      }
      await jouerLieu(page, i === 0 ? 'bon' : route)
    }
    await expect(page.getByRole('heading', { name: 'Mission terminée !' })).toBeVisible()
    await expect(page.getByText(route === 'bon' ? 'Tu as pris la route « je vérifie moi-même ».' : 'Tu as pris la route « je demande à ma mère ».')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Rejouer pour découvrir l’autre route' })).toBeVisible()
    const lieux = lieuxVus.join(' | ')
    if (route === 'bon') {
      expect(lieux).toContain('Le CDI')
      expect(lieux).not.toContain('Le salon')
    } else {
      expect(lieux).toContain('Le salon')
      expect(lieux).not.toContain('Le CDI')
    }
  })
}

test('compteur : la scène annonce « Étape 1 sur 5 »', async ({ page }) => {
  await ouvrirParcours(page)
  await expect(page.getByRole('status').filter({ hasText: /Étape 1 sur 5 :/ })).toBeVisible()
})

for (const scheme of ['light', 'dark'] as const) {
  test(`parcours collège : audit axe à la bifurcation et en fin de mission (${scheme})`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'audit axe exécuté une fois, sous Chromium')
    await page.emulateMedia({ colorScheme: scheme })
    await ouvrirParcours(page)
    await jouerLieu(page, 'bon')
    await expect(page.getByRole('status').filter({ hasText: /Étape 2 sur 5/ })).toBeVisible()
    await verifierA11y(page, `bifurcation (${scheme})`)
    await jouerLieu(page, 'aide')
    for (let i = 0; i < 3; i++) await jouerLieu(page, 'aide')
    await expect(page.getByRole('heading', { name: 'Mission terminée !' })).toBeVisible()
    await verifierA11y(page, `fin de mission (${scheme})`)
  })
}

// ---- Parcours lycée : trois routes (l’île aux hameçons) ----
const MISSION_LYCEE = 'L’île aux hameçons : le stage de seconde'
const CHOIX_REPARATION = 'Une place en stage, enfin : j’envoie ma carte d’identité et mon RIB avant 18 h.'

async function ouvrirParcoursLycee(page: Page) {
  await commencer(page, 'Lycée', 'Solo')
  await ouvrirMission(page, 'Île aux hameçons', MISSION_LYCEE)
  await choisirPersonnageSiDemande(page)
  await expect(page.locator('article.lieu')).toBeVisible()
}

/** Joue la fin de la mission : choix « bon » à chaque lieu, tri classé au fil de l’eau, jusqu’à l’écran de fin. */
async function finirLycee(page: Page, lieuxVus: string[]) {
  const fin = page.getByRole('heading', { name: 'Mission terminée !' })
  for (let i = 0; i < 200; i++) {
    if (await fin.isVisible()) return
    const bon = page.locator('[data-qualite="bon"]')
    const continuer = page.getByRole('button', { name: 'Continuer', exact: true })
    const categorie = page.locator('.tri-categories button:not([disabled])').first()
    const solution = page.getByRole('button', { name: 'Voir la solution' })
    const suivant = page.getByRole('button', { name: /^(Suivant|Terminer le mini-jeu)$/ })
    if (await bon.isVisible()) {
      const etape = page.locator('[aria-current="step"]')
      if (await etape.isVisible()) lieuxVus.push((await etape.innerText()).trim())
      await bon.click()
    } else if (await continuer.isVisible()) await continuer.click()
    else if (await categorie.isVisible()) await categorie.click()
    else if (await solution.isVisible()) await solution.click()
    else if (await suivant.isVisible()) await suivant.click()
    else await page.waitForTimeout(100)
  }
  throw new Error('La mission lycée ne s’est pas terminée')
}

/** Joue les deux premiers lieux : « bon » au premier, puis le choix de la bifurcation selon la route. */
async function jusquALaBifurcation(page: Page, lieuxVus: string[]) {
  lieuxVus.push((await page.locator('[aria-current="step"]').innerText()).trim())
  await jouerLieu(page, 'bon')
  await expect(page.getByRole('status').filter({ hasText: /Étape 2 sur/ })).toBeVisible()
  lieuxVus.push((await page.locator('[aria-current="step"]').innerText()).trim())
}

for (const route of ['bon', 'aide'] as const) {
  test(`parcours lycée : route « ${route} » jusqu’au bout`, async ({ page }) => {
    await ouvrirParcoursLycee(page)
    const lieux: string[] = []
    await jusquALaBifurcation(page, lieux)
    await jouerLieu(page, route)
    await finirLycee(page, lieux)
    await expect(page.getByRole('button', { name: 'Rejouer pour découvrir les autres routes' })).toBeVisible()
    const vus = lieux.join(' | ')
    expect(vus).not.toContain('Devant chez toi')
    expect(vus).toContain(route === 'bon' ? 'L’atelier Boréal' : 'Le CDI')
  })
}

test('parcours lycée : route de réparation, « Tu avances quand même » puis fin', async ({ page }) => {
  await ouvrirParcoursLycee(page)
  const lieux: string[] = []
  await jusquALaBifurcation(page, lieux)
  await page.getByRole('button', { name: CHOIX_REPARATION }).click()
  await page.locator('[data-levier="autre"]').click()
  await expect(page.getByText('Tu avances quand même.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Réessayer' })).toBeVisible()
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await expect(page.getByText('Devant chez toi').first()).toBeVisible()
  await finirLycee(page, lieux)
  await expect(page.getByText('Tu as fait une erreur et tu l’as réparée : c’est aussi un réflexe.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Rejouer pour découvrir les autres routes' })).toBeVisible()
  const vus = lieux.join(' | ')
  expect(vus).toContain('Devant chez toi')
  expect(vus).toContain('Le salon')
  expect(vus).not.toContain('Le CDI')
})

for (const scheme of ['light', 'dark'] as const) {
  test(`parcours lycée : audit axe, bifurcation, réaction de réparation et fin (${scheme})`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'audit axe exécuté une fois, sous Chromium')
    await page.emulateMedia({ colorScheme: scheme })
    await ouvrirParcoursLycee(page)
    const lieux: string[] = []
    await jusquALaBifurcation(page, lieux)
    await verifierA11y(page, `bifurcation lycée (${scheme})`)
    await page.getByRole('button', { name: CHOIX_REPARATION }).click()
    await page.locator('[data-levier="autre"]').click()
    await expect(page.getByText('Tu avances quand même.')).toBeVisible()
    await verifierA11y(page, `réaction « Tu avances quand même » (${scheme})`)
    await page.getByRole('button', { name: 'Continuer', exact: true }).click()
    await finirLycee(page, lieux)
    await expect(page.getByText('c’est aussi un réflexe.')).toBeVisible()
    await verifierA11y(page, `fin de mission lycée (${scheme})`)
  })
}
