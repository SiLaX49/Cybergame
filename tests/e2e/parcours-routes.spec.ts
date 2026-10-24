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
