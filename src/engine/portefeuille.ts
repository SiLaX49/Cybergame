import type { Mission } from '@/content/schema'
import { objetBoutique } from '@/profil/boutique'
import type { Progress } from '@/store/progress'
import { GAINS } from './octets'

/** Date du jour en heure locale, AAAA-MM-JJ (le défi change à minuit chez l’élève). */
export function dateDuJour(maintenant = new Date()): string {
  const deux = (n: number) => String(n).padStart(2, '0')
  return `${maintenant.getFullYear()}-${deux(maintenant.getMonth() + 1)}-${deux(maintenant.getDate())}`
}

type Portefeuille = { octets: Readonly<Record<string, number>>; defis: readonly string[]; achats: readonly string[] }

/** Tous les octets gagnés : meilleurs gains des missions et défis du jour relevés. */
export function totalGagne(p: Portefeuille): number {
  return Object.values(p.octets).reduce((s, n) => s + n, 0) + p.defis.length * GAINS.defiDuJour
}

/** Octets disponibles : gagnés moins dépensés (un achat inconnu, retiré du catalogue, ne coûte plus rien). */
export function solde(p: Portefeuille): number {
  const depense = p.achats.reduce((s, id) => s + (objetBoutique(id)?.prix ?? 0), 0)
  return Math.max(0, totalGagne(p) - depense)
}

/** Hachage simple et stable d’une chaîne (le même jour donne le même défi sur tous les appareils). */
function hacher(texte: string): number {
  let h = 0
  for (const c of texte) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

/**
 * Défi du jour : une mission de la tranche tirée d’après la date, hors rappels et thèmes sensibles.
 * `missions` arrive déjà filtré par tranche ; `sensible` dit si un thème est sensible.
 */
export function defiDuJour(
  missions: Pick<Mission, 'id' | 'type' | 'theme'>[],
  sensible: (theme: string) => boolean,
  date: string,
): string | null {
  const eligibles = missions.filter((m) => m.type !== 'rappel' && !(m.theme && sensible(m.theme))).map((m) => m.id).sort()
  if (eligibles.length === 0) return null
  return eligibles[hacher(date) % eligibles.length]!
}

export interface Objectif {
  id: string
  libelle: string
  fait: boolean
}

export const OBJECTIF_OCTETS = 100

/** Objectifs du jour : ils récompensent autant la réparation d’une erreur que la réussite. */
export function objectifsDuJour(p: { journal: Readonly<Progress['journal']>; defis: readonly string[] }, date: string): Objectif[] {
  const j = p.journal?.date === date ? p.journal : null
  return [
    { id: 'mission', libelle: 'Terminer une mission', fait: (j?.missions ?? 0) >= 1 },
    { id: 'defi', libelle: 'Relever le défi du jour', fait: p.defis.includes(date) },
    { id: 'reparation', libelle: 'Réparer une erreur', fait: (j?.reparations ?? 0) >= 1 },
    { id: 'octets', libelle: `Gagner ${OBJECTIF_OCTETS} octets`, fait: (j?.octets ?? 0) >= OBJECTIF_OCTETS },
  ]
}
