import type { Mission } from '@/content/schema'
import type { RunState } from './mission-runner'
import { bifurcation, choixReparation } from './routes'

/**
 * Les octets, la monnaie du jeu. Ils récompensent le bon réflexe, mais aussi l’erreur qu’on répare
 * ou qu’on retente : se tromper puis réparer rapporte presque autant que réussir du premier coup.
 */
export const GAINS = {
  missionTerminee: 20,
  bonReflexe: 10,
  avecIndice: 7,
  erreurReparee: 8,
  retenteReussie: 6,
  routeReparation: 8,
  parReussiteMinijeu: 2,
  plafondMinijeu: 10,
  surpriseVerifiee: 10,
  surpriseIgnoree: 5,
  defiDuJour: 30,
} as const

export interface LigneOctets {
  libelle: string
  octets: number
}

export interface GainMission {
  lignes: LigneOctets[]
  total: number
}

/** Octets d’une mission terminée, ligne par ligne. Les étapes passées ne rapportent rien. */
export function octetsDuRun(mission: Mission, etat: RunState): GainMission {
  if (!etat.termine) return { lignes: [], total: 0 }
  const compte = new Map<string, number>()
  const ajouter = (libelle: string, octets: number) => {
    if (octets > 0) compte.set(libelle, (compte.get(libelle) ?? 0) + octets)
  }

  ajouter('Mission terminée', GAINS.missionTerminee)
  for (const etape of mission.etapes) {
    const r = etat.resultats[etape.id]
    if (!r) continue
    if (r.type === 'scenario' && !r.passe) {
      if (r.qualite === 'risque') ajouter('Erreur réparée', r.recuperationFaite ? GAINS.erreurReparee : 0)
      else if (r.indiceUtilise) ajouter('Bon réflexe avec un indice', GAINS.avecIndice)
      else ajouter('Bon réflexe', GAINS.bonReflexe)
    } else if (r.type === 'lieu' && !r.passe) {
      const reparation = bifurcation(mission.etapes, etape.id) && choixReparation(mission.etapes, etape.id) === r.choixId
      if (reparation) ajouter('Erreur reconnue, route de réparation', GAINS.routeReparation)
      else if (r.qualite === 'risque') ajouter('Erreur réparée', r.recuperationFaite ? GAINS.erreurReparee : 0)
      else if (r.essais.length > 0) ajouter('Retenté et trouvé', GAINS.retenteReussie)
      else ajouter('Bon réflexe', GAINS.bonReflexe)
    } else if (r.type === 'minijeu') {
      ajouter('Mini-jeu', Math.min(GAINS.plafondMinijeu, r.reussites * GAINS.parReussiteMinijeu))
    } else if (r.type === 'fil' && r.surprise) {
      if (r.surprise === 'verifie' || r.surprise === 'signale') ajouter('Message piège déjoué', GAINS.surpriseVerifiee)
      else if (r.surprise === 'ignore') ajouter('Message piège évité', GAINS.surpriseIgnoree)
    }
  }
  const lignes = [...compte].map(([libelle, octets]) => ({ libelle, octets }))
  return { lignes, total: lignes.reduce((s, l) => s + l.octets, 0) }
}

/** La mission a fait réparer une erreur (récupération, ou route de réparation prise). */
export function aRepareUneErreur(mission: Mission, etat: RunState): boolean {
  return octetsDuRun(mission, etat).lignes.some((l) => l.libelle.startsWith('Erreur'))
}
