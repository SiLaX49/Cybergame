// Chronologie du retour après un choix : quelle étape s'affiche, et à quel instant.
export const ETAPES = ['attente', 'envoi', 'ecrit', 'reaction', 'verdict', 'indices', 'fin'] as const
export type EtapeSequence = (typeof ETAPES)[number]
export interface PasSequence { etape: EtapeSequence; a: number }

/** Instants (ms après le choix) de chaque étape du retour ; instantané = tout d'un coup (animations coupées). */
export function planSequence(o: { reaction: boolean; instantane: boolean }): PasSequence[] {
  if (o.instantane) return [{ etape: 'fin', a: 0 }]
  const pas: PasSequence[] = [{ etape: 'envoi', a: 0 }]
  if (o.reaction) pas.push({ etape: 'ecrit', a: 150 }, { etape: 'reaction', a: 900 }, { etape: 'verdict', a: 1000 })
  else pas.push({ etape: 'verdict', a: 600 })
  const verdict = pas.at(-1)!.a
  pas.push({ etape: 'indices', a: verdict + 400 }, { etape: 'fin', a: verdict + 800 })
  return pas
}

/** Vrai si l'étape `courante` a atteint ou dépassé `cible`. */
export const atteinte = (courante: EtapeSequence, cible: EtapeSequence) => ETAPES.indexOf(courante) >= ETAPES.indexOf(cible)
