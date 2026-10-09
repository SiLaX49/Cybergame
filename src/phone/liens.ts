export type Morceau = { type: 'texte' | 'lien'; texte: string }

// Domaine en minuscules avec au moins un point, chemin éventuel. Pas précédé de @ ni d'un caractère de mot,
// pas suivi de @ : les adresses mail et les « M. Durand. » ne sont pas des liens.
const LIEN = /(?<![\w@./-])(?:https?:\/\/)?(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,24}(?![\w@-])(?:\/[^\s«»"]*)?/gu

/** Découpe un message en morceaux de texte et liens (affichés soulignés, jamais cliquables). */
export function decouperLiens(texte: string): Morceau[] {
  const morceaux: Morceau[] = []
  let curseur = 0
  for (const m of texte.matchAll(LIEN)) {
    const lien = m[0].replace(/[.,;:!?)]+$/u, '')
    if (m.index > curseur) morceaux.push({ type: 'texte', texte: texte.slice(curseur, m.index) })
    morceaux.push({ type: 'lien', texte: lien })
    curseur = m.index + lien.length
  }
  if (curseur < texte.length) morceaux.push({ type: 'texte', texte: texte.slice(curseur) })
  return morceaux
}

/** Barre d'adresse : domaine mis en avant, reste atténué ; seul le http est signalé. */
export function decouperUrl(url: string) {
  const sansSchema = url.replace(/^https?:\/\//, '')
  const i = sansSchema.search(/[/?#]/)
  return {
    nonSecurise: url.startsWith('http://'),
    domaine: i < 0 ? sansSchema : sansSchema.slice(0, i),
    reste: i < 0 ? '' : sansSchema.slice(i),
  }
}
