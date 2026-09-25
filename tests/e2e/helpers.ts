import { expect, type Page } from '@playwright/test'

export async function commencer(page: Page, tranche: '6e' | '5e – 3e' | 'Lycée', mode: 'Solo' | 'Binôme' | 'Classe entière') {
  await page.goto('/')
  await page.getByRole('radio', { name: tranche, exact: true }).check()
  await page.getByRole('radio', { name: new RegExp(mode) }).check()
  await page.getByRole('button', { name: /C.est parti|Continuer/ }).click()
  await expect(page.getByRole('heading', { name: 'Choisis un thème' })).toBeVisible()
}

/** Joue la mission affichée jusqu'à la fin en choisissant toujours « demander de l'aide » et « Je ne sais pas ». */
export async function jouerMission(page: Page) {
  const fin = page.getByRole('heading', { name: 'Mission terminée !' })
  for (let i = 0; i < 300; i++) {
    if (await fin.isVisible()) return
    const suivant = page.getByRole('button', { name: /^(Suivant|Terminer le mini-jeu)$/ })
    const validerClasse = page.getByRole('button', { name: 'Valider le choix de la classe' })
    const aide = page.locator('[data-qualite="aide"]')
    const jeNeSaisPas = page.getByRole('button', { name: 'Je ne sais pas' })
    const continuer = page.getByRole('button', { name: 'Continuer', exact: true })
    const categorie = page.locator('.tri-categories button:not([disabled])').first()
    const solution = page.getByRole('button', { name: 'Voir la solution' })
    const verifier = page.getByRole('radio', { name: 'Je vérifie autrement' })
    const commencerSensible = page.getByRole('button', { name: 'Commencer' })

    if (await suivant.isVisible()) await suivant.click()
    else if ((await validerClasse.isVisible()) && (await validerClasse.isEnabled())) await validerClasse.click()
    else if (await aide.isVisible()) await aide.click()
    else if (await jeNeSaisPas.isVisible()) await jeNeSaisPas.click()
    else if (await continuer.isVisible()) await continuer.click()
    else if (await categorie.isVisible()) await categorie.click()
    else if (await solution.isVisible()) await solution.click()
    else if (await verifier.first().isVisible()) {
      for (const radio of await verifier.all()) await radio.check()
      await page.getByRole('button', { name: 'Valider mes choix' }).click()
    } else if (await commencerSensible.isVisible()) await commencerSensible.click()
    else await page.waitForTimeout(100)
  }
  throw new Error('La mission ne s’est pas terminée')
}

export async function tabJusqua(page: Page, texte: string) {
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab')
    const actif = await page.evaluate(() => {
      const el = document.activeElement
      // Pour une case ou un bouton radio, on lit le texte de son libellé.
      return (el?.closest('label') ?? el)?.textContent?.trim() ?? ''
    })
    if (actif.includes(texte)) return
  }
  throw new Error(`Élément introuvable au clavier : ${texte}`)
}

/** Vérifie que le focus n'est pas retombé sur <body> (WCAG 2.4.3). */
export async function focusConserve(page: Page) {
  await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).not.toBe('BODY')
}
