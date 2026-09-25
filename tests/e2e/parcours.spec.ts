import { expect, test } from '@playwright/test'
import { commencer, jouerMission, tabJusqua } from './helpers'

test('solo 6e : une mission complète, puis la carte la marque terminée', async ({ page }) => {
  await commencer(page, '6e', 'Solo')
  await page.getByRole('link', { name: 'Le colis mystère' }).click()
  await jouerMission(page)
  await expect(page.getByText('Mission accomplie')).toBeVisible()
  await page.getByRole('link', { name: 'Retour à la carte' }).click()
  await expect(page.getByText('Terminée').first()).toBeVisible()
})

test('un choix risqué mène à un geste de récupération', async ({ page }) => {
  await page.goto('/#/mission/p-6e-colis')
  await page.locator('[data-choix="clic"]').click()
  await page.getByRole('button', { name: 'Je ne sais pas' }).click()
  await expect(page.getByText('C’était risqué')).toBeVisible()
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'À qui en parler ?' })).toBeVisible()
  await page.getByRole('button', { name: /Un parent/ }).click()
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await expect(page.getByText('Étape 2 sur 4')).toBeVisible()
})

test('un scénario complet au clavier', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit ne tabule pas vers les boutons par défaut')
  await page.goto('/#/mission/p-6e-colis')
  await tabJusqua(page, 'Je demande de l’aide')
  await page.keyboard.press('Enter')
  await tabJusqua(page, 'Je ne sais pas')
  await page.keyboard.press('Enter')
  await tabJusqua(page, 'Continuer')
  await page.keyboard.press('Enter')
  await expect(page.getByText('Étape 2 sur 4')).toBeVisible()
})

test('classe entière : l’adulte valide le choix de la classe', async ({ page }) => {
  await commencer(page, '6e', 'Classe entière')
  await page.getByRole('link', { name: 'Le colis mystère' }).click()
  await page.locator('[data-qualite="aide"]').click()
  await expect(page.getByRole('heading', { name: 'Qu’est-ce qui t’a décidé ?' })).toBeHidden()
  await page.getByRole('button', { name: 'Valider le choix de la classe' }).click()
  await expect(page.getByRole('heading', { name: 'Qu’est-ce qui t’a décidé ?' })).toBeVisible()
})

test('rappel : le message piège est révélé à la fin', async ({ page }) => {
  await page.goto('/#/mission/r-6e')
  for (const radio of await page.getByRole('radio', { name: 'J’ouvre / je clique' }).all()) await radio.check()
  await page.getByRole('button', { name: 'Valider mes choix' }).click()
  await jouerMission(page)
  await expect(page.getByRole('heading', { name: 'Le message piège était…' })).toBeVisible()
  await expect(page.getByText('Tu as ouvert ce message piège')).toBeVisible()
})

test('stockage bloqué : le jeu reste jouable et le signale', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Accès refusé', 'SecurityError')
      },
    })
  })
  await commencer(page, 'Lycée', 'Solo')
  await expect(page.getByText('Ta progression ne pourra pas être enregistrée sur cet appareil.')).toBeVisible()
})

test('enseignant : fiche imprimable et version papier', async ({ page }) => {
  await page.goto('/#/enseignants/p-6e-colis')
  await expect(page.getByRole('heading', { name: 'Le colis mystère', level: 1 })).toBeVisible()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.app-header')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Imprimer la fiche' })).toBeHidden()
  await page.emulateMedia({ media: 'screen' })
  await page.getByRole('link', { name: 'Version papier (plan B)' }).click()
  await expect(page.getByRole('heading', { name: 'Corrigé (pour l’adulte)' })).toBeVisible()
})
