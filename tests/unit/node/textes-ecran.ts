import type { Ecran } from '../../../src/content/schema'
import { texteStats } from '../../../src/phone/stats'

/** Tous les textes visibles d'un faux écran, en lecture normale ou simplifiée. */
export function textesEcran(e: Ecran, simple = false): string[] {
  const t = (x: { texte: string; texteSimple?: string }) => (simple ? (x.texteSimple ?? x.texte) : x.texte)
  const textes = [e.appNom, e.contact, ...e.messages.flatMap((m) => [t(m), m.apercu?.titre ?? '', m.apercu?.domaine ?? ''])]
  if (e.app === 'mail') textes.push(e.sujet ?? '', e.adresse ?? '', e.pieceJointe?.nom ?? '')
  if (e.app === 'web') textes.push(e.url ?? '')
  if (e.app === 'social') {
    textes.push(e.abonnes ? `${e.abonnes} abonnés` : '', e.bio ?? '', texteStats(e.stats ?? {}))
    if (e.media) textes.push(simple ? (e.media.descriptionSimple ?? e.media.description) : e.media.description)
    for (const c of e.commentaires ?? []) textes.push(c.de, t(c))
  }
  return textes
}
