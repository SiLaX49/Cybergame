import { expect, test, type Page } from '@playwright/test'
import { jouerMission, ouvrirNotification } from './helpers'

// Missions sensibles jouées en entier, sur trois navigateurs : plus longues que le délai par défaut.
test.describe.configure({ timeout: 90_000 })

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
  await ouvrirNotification(page)
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
  await ouvrirNotification(page)
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

test('rencontres : « protège-toi », motif « mineur » au signalement, et « soutenir » adapté', async ({ page }) => {
  await page.goto('/#/mission/r-6e-ami-du-jeu')
  await page.getByRole('button', { name: 'Commencer' }).click()
  await ouvrirNotification(page)
  await page.locator('[data-choix="accepte"]').click()
  await page.locator('[data-levier="autre"]').click()
  await expect(page.getByRole('heading', { name: 'Ce qui a pu peser' })).toBeVisible()
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Maintenant, protège-toi' })).toBeFocused()
  await page.getByRole('button', { name: 'Menu du contact' }).click()
  await page.getByRole('button', { name: 'Bloquer', exact: true }).click()
  await page.getByRole('radio', { name: 'Comportement inquiétant envers un mineur' }).check()
  await page.getByRole('button', { name: 'Envoyer le signalement' }).click()
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await expect(page.getByText('Étape 2 sur')).toBeVisible()
  await page.getByRole('button', { name: 'Passer ce scénario' }).click()
  await expect(page.getByText('Étape 3 sur')).toBeVisible()
  await ouvrirNotification(page)
  await page.locator('[data-choix="promet"]').click()
  await page.locator('[data-levier="autre"]').click()
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Maintenant, limite les dégâts' })).toBeFocused()
  await expect(page.getByRole('heading', { name: 'Écris à ton ami·e, en privé' })).toBeVisible()
  await expect(page.getByText(/harceleurs|ils sont bêtes/)).toHaveCount(0)
  await page.getByRole('radio', { name: 'Promis, je ne dirai rien.' }).check()
  await page.getByRole('button', { name: 'Envoyer', exact: true }).click()
  await expect(page.getByText('Mais ce secret-là ne se garde pas')).toBeVisible()
  await page.getByRole('radio', { name: 'Ce n’est pas ta faute, je suis là.' }).check()
  await page.getByRole('button', { name: 'Envoyer', exact: true }).click()
  await expect(page.getByText('Ce secret-là ne se garde pas : préviens un adulte ou le 3018.')).toBeVisible()
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await expect(page.getByText('Étape 4 sur')).toBeVisible()
})

test('plan B d’une mission sensible : bandeau « Brouillon », formulation neutre et aides', async ({ page }) => {
  await page.goto('/#/enseignants/r-6e-ami-du-jeu/plan-b')
  await expect(page.getByText('Brouillon :')).toBeVisible()
  await expect(page.getByText('Si tu as fait ce choix, qu’est-ce qui a pesé ?').first()).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Besoin d’aide ?' })).toContainText('3018')
})
