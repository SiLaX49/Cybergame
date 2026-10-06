import { expect, type Page } from '@playwright/test'

export async function commencer(page: Page, tranche: '6e' | '5e – 3e' | 'Lycée', mode: 'Solo' | 'Binôme' | 'Classe entière') {
  await page.goto('/')
  await page.getByRole('radio', { name: tranche, exact: true }).check()
  await page.getByRole('radio', { name: new RegExp(mode) }).check()
  await page.getByRole('button', { name: /C.est parti|Continuer/ }).click()
  await expect(page.getByRole('heading', { name: 'Choisis un thème' })).toBeVisible()
}

/** Si l’écran « Choisis ton personnage » est affiché (premier parcours), choisit le premier personnage. */
export async function choisirPersonnageSiDemande(page: Page) {
  // Juste après goto, la page n’est peut-être pas encore rendue : on attend l’écran de départ ou un lieu.
  await expect(page.getByRole('heading', { name: 'Avant de partir' }).or(page.locator('article.lieu')).first()).toBeVisible()
  await personnageSiAffiche(page)
}

/** Choisit le premier personnage si l’écran de départ est affiché à cet instant, sans attendre. */
async function personnageSiAffiche(page: Page) {
  const partir = page.getByRole('button', { name: 'C’est parti !' })
  if (!(await partir.isVisible())) return
  await page.locator('input[name="personnage"]').first().check()
  await partir.click()
}

/** Joue la mission affichée jusqu'à la fin en choisissant toujours « demander de l'aide ». */
export async function jouerMission(page: Page) {
  const fin = page.getByRole('heading', { name: 'Mission terminée !' })
  for (let i = 0; i < 300; i++) {
    if (await fin.isVisible()) return
    await personnageSiAffiche(page)
    const suivant = page.getByRole('button', { name: /^(Suivant|Terminer le mini-jeu|Appli suivante)$/ })
    const validerClasse = page.getByRole('button', { name: 'Valider le choix de la classe' })
    const aide = page.locator('[data-qualite="aide"]')
    const continuer = page.getByRole('button', { name: 'Continuer', exact: true })
    const categorie = page.locator('.tri-categories button:not([disabled])').first()
    const solution = page.getByRole('button', { name: 'Voir la solution' })
    const notifs = page.locator('[data-notif]')
    const commencerSensible = page.getByRole('button', { name: 'Commencer' })
    const jePasse = page.getByRole('button', { name: 'Je passe' })
    const verifierProfil = page.getByRole('button', { name: 'Vérifier mon profil' })
    const douteux = page.locator('[data-verdict="douteux"]:not([disabled])')
    const refuser = page.getByRole('radio', { name: 'Refuser' })
    const validerPermissions = page.getByRole('button', { name: 'Valider les permissions' })

    if (await suivant.isVisible()) await suivant.click()
    else if ((await validerClasse.isVisible()) && (await validerClasse.isEnabled())) await validerClasse.click()
    else if (await aide.isVisible()) await aide.click()
    else if (await page.locator('[data-levier="autre"]').isVisible()) await page.locator('[data-levier="autre"]').click()
    else if (await continuer.isVisible()) await continuer.click()
    else if (await categorie.isVisible()) await categorie.click()
    else if (await solution.isVisible()) await solution.click()
    else if (await notifs.first().isVisible()) {
      for (const n of await notifs.all()) {
        await n.click()
        await page.getByRole('button', { name: 'Je vérifie autrement' }).click()
      }
      await page.getByRole('button', { name: 'Valider mes choix' }).click()
    } else if (await commencerSensible.isVisible()) await commencerSensible.click()
    else if (await jePasse.isVisible()) await jePasse.click()
    else if (await verifierProfil.isVisible()) await verifierProfil.click()
    else if (await douteux.isVisible()) await douteux.click()
    else if (await validerPermissions.isVisible()) {
      for (const radio of await refuser.all()) if (await radio.isEnabled()) await radio.check()
      await validerPermissions.click()
    }
    else await page.waitForTimeout(100)
  }
  throw new Error('La mission ne s’est pas terminée')
}

/** Joue les scénarios (choix « aide ») jusqu’à l’affichage du mini-jeu. */
export async function jouerJusquAuMiniJeu(page: Page) {
  const titre = page.getByRole('heading', { name: 'Mini-jeu', exact: true })
  for (let i = 0; i < 100; i++) {
    if (await titre.isVisible()) return
    const aide = page.locator('[data-qualite="aide"]')
    const continuer = page.getByRole('button', { name: 'Continuer', exact: true })
    if (await aide.isVisible()) await aide.click()
    else if (await continuer.isVisible()) await continuer.click()
    else await page.waitForTimeout(100)
  }
  throw new Error('Le mini-jeu n’est pas apparu')
}

export async function tabJusqua(page: Page, texte: string) {
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab')
    const actif = await page.evaluate(() => {
      const el = document.activeElement
      // Firefox rend focalisables les zones défilantes (liste des choix du téléphone) : on les ignore,
      // car leur texte contient celui des boutons qu’elles englobent.
      if (!el?.matches('a, button, input, select, textarea, summary')) return ''
      // Pour une case ou un bouton radio, on lit le texte de son libellé.
      return (el?.closest('label') ?? el)?.textContent?.trim() ?? ''
    })
    if (actif.includes(texte)) return
  }
  throw new Error(`Élément introuvable au clavier : ${texte}`)
}

/** Tabule jusqu'à l'élément qui correspond au sélecteur CSS (indépendant du texte, qui peut évoluer). */
export async function tabJusquaSelecteur(page: Page, selecteur: string) {
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab')
    if (await page.evaluate((s) => document.activeElement?.matches(s) ?? false, selecteur)) return
  }
  throw new Error(`Élément introuvable au clavier : ${selecteur}`)
}

/** Vérifie que le focus n'est pas retombé sur <body> (WCAG 2.4.3). */
export async function focusConserve(page: Page) {
  await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).not.toBe('BODY')
}
