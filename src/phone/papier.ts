import type { Ecran } from '@/content/schema'
import { texteStats } from './stats'

/** Version papier d'un faux écran : tout ce que l'élève verrait, dans l'ordre de l'écran. */
export function lignesPapier(e: Ecran): string[] {
  const lignes = [`${e.appNom} · ${e.contact}`]
  if (e.app === 'mail') {
    if (e.adresse) lignes.push(`Adresse de l’expéditeur : ${e.adresse}`)
    if (e.sujet) lignes.push(`Objet : ${e.sujet}`)
  }
  if (e.app === 'web' && e.url) lignes.push(`Adresse : ${e.url}`)
  if (e.app === 'social') {
    const compte = [e.certifie ? 'Compte certifié' : '', e.abonnes ? `${e.abonnes} abonnés` : '', e.bio ? `Bio : ${e.bio}` : '']
    if (compte.some(Boolean)) lignes.push(compte.filter(Boolean).join(' · '))
  }
  for (const m of e.messages) {
    lignes.push(`${m.de === 'moi' ? 'Moi' : e.contact} : ${m.texte}`)
    if (m.apercu) lignes.push(`Aperçu du lien : ${m.apercu.titre} (${m.apercu.domaine})`)
  }
  if (e.app === 'web' && e.boutons) lignes.push(`Boutons : ${e.boutons.map((b) => `[${b}]`).join(' ')}`)
  if (e.app === 'social') {
    if (e.media) lignes.push(`[${e.media.description}]`)
    const stats = texteStats(e.stats ?? {})
    if (stats) lignes.push(stats)
    for (const c of e.commentaires ?? []) lignes.push(`${c.de} : ${c.texte}`)
  }
  if (e.app === 'mail' && e.pieceJointe) lignes.push(`Pièce jointe : ${e.pieceJointe.nom}`)
  return lignes
}
