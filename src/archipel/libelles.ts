import type { EtatIle } from './progression'

const missionsTexte = (n: number, total: number) =>
  `${n} mission${n > 1 ? 's' : ''} sur ${total} terminée${n > 1 ? 's' : ''}`

/** Nom accessible complet d’une île sur la carte. */
export function nomAccessibleIle(o: { nom: string; objet: string | null; calme: boolean; ici: boolean; etat: EtatIle }): string {
  const parties: string[] = []
  if (o.etat.total === 0) parties.push('bientôt disponible')
  else parties.push(missionsTexte(o.etat.terminees, o.etat.total))
  if (!o.calme && o.objet && o.etat.aParcours) parties.push(o.etat.objetGagne ? `${o.objet} gagné` : `${o.objet} à gagner`)
  if (o.ici) parties.push('tu es ici')
  return `${o.nom} — ${parties.join(', ')}`
}

/** Compteur visible sous l’île. */
export const compteurIle = (e: EtatIle) => (e.total === 0 ? 'Bientôt disponible' : `${e.terminees} / ${e.total} missions`)
