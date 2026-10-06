import { expect, test, type Page } from '@playwright/test'
import { jouerMission } from './helpers'

// Ces missions sont des brouillons (relecture « a-relire ») : elles n’existent que dans le build VITE_BROUILLONS=1 des tests.
const MISSIONS = [
  ['h-6e-surnom', 'Juste pour rire ?'],
  ['h-college-faux-compte', 'Le faux compte'],
  ['h-lycee-rumeur', 'La rumeur'],
  ['r-6e-ami-du-jeu', 'L’ami du jeu'],
  ['r-college-chantage', 'Garde ça entre nous'],
  ['r-lycee-webcam', 'Derrière l’écran'],
] as const

async function passerScenarios(page: Page, n: number) {
  for (let i = 0; i < n; i++) {
    await page.getByRole('button', { name: 'Passer ce scénario' }).click()
    await expect(page.getByText(`Étape ${i + 2} sur`)).toBeVisible()
  }
}

for (const [id, titre] of MISSIONS) {
  test(`mission sensible ${id} : avertissement, bandeaux, puis jouée jusqu’au bout`, async ({ page }) => {
    await page.goto(`/#/mission/${id}`)
    await expect(page.getByRole('heading', { name: titre, level: 1 })).toBeVisible()
    await expect(page.getByText('Brouillon :')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Avant de commencer' })).toBeVisible()
    await expect(page.getByRole('complementary', { name: 'Besoin d’aide ?' })).toContainText('3018')
    await expect(page.locator('[data-qualite="aide"]')).toHaveCount(0)
    await page.getByRole('button', { name: 'Commencer' }).click()
    await expect(page.getByRole('heading', { name: 'Avant de commencer' })).toBeHidden()
    await expect(page.getByRole('complementary', { name: 'Besoin d’aide ?' })).toBeVisible()
    await jouerMission(page)
    await expect(page.getByRole('heading', { name: 'Mission terminée !' })).toBeVisible()
    await expect(page.getByText('Brouillon :')).toBeVisible()
  })
}

test('« Passer ce scénario » avance sans pénalité', async ({ page }) => {
  await page.goto('/#/mission/h-6e-surnom')
  await page.getByRole('button', { name: 'Commencer' }).click()
  await expect(page.getByText('Étape 1 sur')).toBeVisible()
  await passerScenarios(page, 1)
})

test('harcèlement, témoin : un choix risqué mène à « soutenir »', async ({ page }) => {
  await page.goto('/#/mission/h-6e-surnom')
  await page.getByRole('button', { name: 'Commencer' }).click()
  await passerScenarios(page, 1)
  await page.locator('[data-choix="envoie-ami"]').click()
  await page.locator('[data-levier="autre"]').click()
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Maintenant, limite les dégâts' })).toBeFocused()
  await expect(page.getByRole('heading', { name: 'Écris à la personne visée, en privé' })).toBeVisible()
  await page.getByRole('radio', { name: 'Laisse tomber, ils sont bêtes.' }).check()
  await page.getByRole('button', { name: 'Envoyer', exact: true }).click()
  await expect(page.getByText('Ton message part d’une bonne intention')).toBeVisible()
  await page.getByRole('radio', { name: 'Je suis là si tu veux en parler.' }).check()
  await page.getByRole('button', { name: 'Envoyer', exact: true }).click()
  await expect(page.getByText('Message envoyé.')).toBeVisible()
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await expect(page.getByText('Étape 3 sur')).toBeVisible()
})

test('harcèlement, auteur : un choix risqué mène à « retirer la publication »', async ({ page }) => {
  await page.goto('/#/mission/h-6e-surnom')
  await page.getByRole('button', { name: 'Commencer' }).click()
  await passerScenarios(page, 2)
  await page.locator('[data-choix="laisse"]').click()
  await page.locator('[data-levier="autre"]').click()
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Maintenant, limite les dégâts' })).toBeFocused()
  await expect(page.getByRole('heading', { name: 'Répare ce que tu as publié' })).toBeVisible()
  await page.getByRole('button', { name: 'Supprimer ma publication' }).click()
  await page.getByRole('radio', { name: /Désolé·e si tu t’es senti·e vexé·e/ }).check()
  await page.getByRole('button', { name: 'Envoyer', exact: true }).click()
  await expect(page.getByText('Cette excuse rejette la faute sur l’autre')).toBeVisible()
  await page.getByRole('radio', { name: /ce que j’ai publié était blessant/ }).check()
  await page.getByRole('button', { name: 'Envoyer', exact: true }).click()
  await page.getByRole('button', { name: 'Demander aux autres de ne pas repartager' }).click()
  await expect(page.getByText('C’est possible de réparer.')).toBeVisible()
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await expect(page.getByText('Étape 4 sur')).toBeVisible()
})
