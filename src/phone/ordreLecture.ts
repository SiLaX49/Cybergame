import type { Ecran } from '@/content/schema'
import { decouperUrl } from './liens'

type Lecture = (texte: string, texteSimple?: string) => string

/**
 * Textes surlignables d’un écran, dans l’ordre où l’élève les lit : en-tête, puis corps de haut en bas.
 * Miroir des applis (seuls les textes rendus par `TexteRiche` y figurent) ; `t` choisit la lecture simplifiée.
 */
export function textesLus(e: Ecran, t: Lecture): string[] {
  const corps = e.messages.map((m) => t(m.texte, m.texteSimple))
  if (e.app === 'sms' || e.app === 'chat') return [e.contact, ...corps]
  if (e.app === 'mail') return [e.sujet ?? '', e.contact, e.adresse ?? '', ...corps]
  if (e.app === 'web') {
    const adresse = e.url ? decouperUrl(e.url) : null
    return [adresse?.domaine ?? '', adresse?.reste ?? '', ...corps, ...(e.boutons ?? [])]
  }
  return [
    e.contact,
    e.abonnes ? `${e.abonnes} abonnés` : '',
    e.bio ?? '',
    ...corps,
    e.media ? t(e.media.description, e.media.descriptionSimple) : '',
    ...(e.commentaires ?? []).map((c) => t(c.texte, c.texteSimple)),
  ]
}

/**
 * Indices triés selon la première apparition de leur passage dans les textes lus (texte, puis position dans
 * le texte) : le rang donne le numéro, donc ① est lu avant ②. Sans passage visible : après, dans leur ordre.
 */
export function ordreLecture<T extends { passage?: string }>(indices: readonly T[], textes: readonly string[]): T[] {
  const position = (passage?: string): [number, number] => {
    for (const [n, texte] of textes.entries()) {
      const i = passage ? texte.indexOf(passage) : -1
      if (i >= 0) return [n, i]
    }
    return [textes.length, 0]
  }
  return indices
    .map((item) => ({ item, p: position(item.passage) }))
    .sort((a, b) => a.p[0] - b.p[0] || a.p[1] - b.p[1])
    .map(({ item }) => item)
}
