import type { Etape, FilAction, LevierId, Mission, Qualite, ReponseLevier } from '@/content/schema'

export type PhaseScenario = 'situation' | 'pourquoi' | 'indices' | 'consequence' | 'recuperation'
export type SurpriseResultat = 'verifie' | 'ignore' | 'signale' | 'piege'

export interface ScenarioResultat {
  type: 'scenario'
  choixId: string | null
  qualite: Qualite | null
  indicesChoisis: string[]
  indicesJustes: number
  indicesFaux: number
  levier: ReponseLevier | null
  recuperationFaite: boolean | null
  passe: boolean
}
/** Résultat d’un lieu de parcours : comme un scénario, sans étape « indices ». */
export interface LieuResultat {
  type: 'lieu'
  choixId: string | null
  qualite: Qualite | null
  levier: ReponseLevier | null
  recuperationFaite: boolean | null
  /** Choix risqués déjà essayés dans ce lieu, dans l’ordre ; interdits au prochain essai. */
  essais: string[]
  passe: boolean
}
export interface MinijeuResultat {
  type: 'minijeu'
  reussites: number
  erreurs: number
}
export interface FilResultat {
  type: 'fil'
  actions: Record<string, FilAction>
  surprise: SurpriseResultat | null
}
export type EtapeResultat = ScenarioResultat | LieuResultat | MinijeuResultat | FilResultat
export type ChoixResultat = ScenarioResultat | LieuResultat

export interface RunState {
  index: number
  phase: PhaseScenario | null
  choixId: string | null
  resultats: Record<string, EtapeResultat>
  termine: boolean
  /** Leviers choisis pendant le run, dans l'ordre, sans doublon ; conservés même après « rejouer ». En mémoire seulement. */
  leviersCedes: ReponseLevier[]
}

export type RunEvent =
  | { type: 'choisir'; choixId: string }
  | { type: 'valider-indices'; indices: string[] }
  | { type: 'continuer' }
  | { type: 'recuperation-faite' }
  | { type: 'rejouer' }
  | { type: 'passer' }
  | { type: 'expliquer'; levier: ReponseLevier }
  | { type: 'minijeu-termine'; reussites: number; erreurs: number }
  | { type: 'fil-termine'; actions: Record<string, FilAction> }

export class RunError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RunError'
  }
}

const phaseInitiale = (etape: Etape | undefined): PhaseScenario | null =>
  etape?.type === 'scenario' || etape?.type === 'lieu' ? 'situation' : null

const resultatVide = (etape: Etape): ChoixResultat =>
  etape.type === 'lieu'
    ? { type: 'lieu', choixId: null, qualite: null, levier: null, recuperationFaite: null, essais: [], passe: false }
    : {
        type: 'scenario',
        choixId: null,
        qualite: null,
        indicesChoisis: [],
        indicesJustes: 0,
        indicesFaux: 0,
        levier: null,
        recuperationFaite: null,
        passe: false,
      }

const essaisDe = (r: EtapeResultat | undefined): string[] => (r?.type === 'lieu' ? r.essais : [])

export function demarrer(mission: Mission): RunState {
  return { index: 0, phase: phaseInitiale(mission.etapes[0]), choixId: null, resultats: {}, termine: false, leviersCedes: [] }
}

export function etapeCourante(mission: Mission, etat: RunState): Etape | null {
  return etat.termine ? null : (mission.etapes[etat.index] ?? null)
}

function suivante(mission: Mission, etat: RunState, resultats: Record<string, EtapeResultat>): RunState {
  const index = etat.index + 1
  const termine = index >= mission.etapes.length
  return { ...etat, index, phase: termine ? null : phaseInitiale(mission.etapes[index]), choixId: null, resultats, termine }
}

const SURPRISES: Record<FilAction, SurpriseResultat> = {
  ouvrir: 'piege',
  verifier: 'verifie',
  signaler: 'signale',
  ignorer: 'ignore',
}
export const surpriseResultat = (action: FilAction): SurpriseResultat => SURPRISES[action]

export function reduire(mission: Mission, etat: RunState, evenement: RunEvent): RunState {
  const etape = etapeCourante(mission, etat)
  if (!etape) throw new RunError('la mission est terminée')
  const refuser = (): never => {
    throw new RunError(`événement « ${evenement.type} » impossible (étape ${etape.type}, phase ${etat.phase})`)
  }

  switch (evenement.type) {
    case 'choisir': {
      if ((etape.type !== 'scenario' && etape.type !== 'lieu') || etat.phase !== 'situation') return refuser()
      const choix = etape.choix.find((c) => c.id === evenement.choixId)
      if (!choix) throw new RunError(`choix inconnu : ${evenement.choixId}`)
      if (etape.type === 'lieu' && essaisDe(etat.resultats[etape.id]).includes(choix.id)) {
        throw new RunError(`choix déjà essayé : ${choix.id}`)
      }
      if (choix.qualite === 'risque' && etape.pourquoi) return { ...etat, phase: 'pourquoi', choixId: choix.id }
      if (etape.type === 'scenario') return { ...etat, phase: 'indices', choixId: choix.id }
      // Un lieu n'a pas d'étape « indices » : la réaction suit directement le choix.
      const resultat: LieuResultat = {
        ...(resultatVide(etape) as LieuResultat),
        essais: essaisDe(etat.resultats[etape.id]),
        // Le geste de récupération fait après un essai risqué reste acquis quand on trouve le bon choix.
        recuperationFaite: (etat.resultats[etape.id] as LieuResultat | undefined)?.recuperationFaite ?? null,
        choixId: choix.id,
        qualite: choix.qualite,
      }
      return { ...etat, phase: 'consequence', choixId: choix.id, resultats: { ...etat.resultats, [etape.id]: resultat } }
    }
    case 'expliquer': {
      if ((etape.type !== 'scenario' && etape.type !== 'lieu') || etat.phase !== 'pourquoi') return refuser()
      const choix = etape.choix.find((c) => c.id === etat.choixId)
      if (!choix) return refuser()
      if (evenement.levier !== 'autre' && !etape.pourquoi?.some((p) => p.levier === evenement.levier)) {
        throw new RunError(`levier inconnu : ${evenement.levier}`)
      }
      const base = resultatVide(etape)
      const resultat: ChoixResultat = {
        ...base,
        ...(base.type === 'lieu' ? { essais: [...essaisDe(etat.resultats[etape.id]), choix.id] } : {}),
        choixId: choix.id,
        qualite: choix.qualite,
        levier: evenement.levier,
      }
      const leviersCedes = etat.leviersCedes.includes(evenement.levier)
        ? etat.leviersCedes
        : [...etat.leviersCedes, evenement.levier]
      return { ...etat, phase: 'consequence', resultats: { ...etat.resultats, [etape.id]: resultat }, leviersCedes }
    }
    case 'valider-indices': {
      if (etape.type !== 'scenario' || etat.phase !== 'indices') return refuser()
      const choix = etape.choix.find((c) => c.id === etat.choixId)
      if (!choix) return refuser()
      const pertinents = new Set(etape.indices.filter((i) => i.pertinent).map((i) => i.id))
      const connus = new Set(etape.indices.map((i) => i.id))
      const indices = evenement.indices.filter((id) => connus.has(id))
      const resultat: ScenarioResultat = {
        type: 'scenario',
        choixId: choix.id,
        qualite: choix.qualite,
        indicesChoisis: indices,
        indicesJustes: indices.filter((id) => pertinents.has(id)).length,
        indicesFaux: indices.filter((id) => !pertinents.has(id)).length,
        levier: null,
        recuperationFaite: null,
        passe: false,
      }
      return { ...etat, phase: 'consequence', resultats: { ...etat.resultats, [etape.id]: resultat } }
    }
    case 'continuer': {
      if ((etape.type !== 'scenario' && etape.type !== 'lieu') || etat.phase !== 'consequence') return refuser()
      const resultat = etat.resultats[etape.id] as ChoixResultat
      const recupere = !!(etape.recuperation && etat.choixId && etape.recuperation.siChoix.includes(etat.choixId))
      if (etape.type === 'lieu' && resultat.qualite === 'risque' && !recupere) return refuser()
      if (recupere) {
        return {
          ...etat,
          phase: 'recuperation',
          resultats: { ...etat.resultats, [etape.id]: { ...resultat, recuperationFaite: false } },
        }
      }
      return suivante(mission, etat, etat.resultats)
    }
    case 'recuperation-faite': {
      if ((etape.type !== 'scenario' && etape.type !== 'lieu') || etat.phase !== 'recuperation') return refuser()
      const resultat = etat.resultats[etape.id] as ChoixResultat
      if (etape.type === 'lieu' && resultat.qualite === 'risque') {
        return {
          ...etat,
          phase: 'situation',
          choixId: null,
          resultats: { ...etat.resultats, [etape.id]: { ...resultat, recuperationFaite: true } },
        }
      }
      return suivante(mission, etat, { ...etat.resultats, [etape.id]: { ...resultat, recuperationFaite: true } })
    }
    case 'rejouer': {
      if ((etape.type !== 'scenario' && etape.type !== 'lieu') || etat.phase !== 'consequence') return refuser()
      if (etape.type === 'lieu') {
        const resultat = etat.resultats[etape.id] as LieuResultat
        if (resultat.qualite === 'risque') return { ...etat, phase: 'situation', choixId: null }
        // Les essais et le geste de récupération déjà fait après un piège restent acquis.
        const vide: LieuResultat = {
          ...(resultatVide(etape) as LieuResultat),
          essais: essaisDe(resultat),
          recuperationFaite: resultat.essais.length ? resultat.recuperationFaite : null,
        }
        return { ...etat, phase: 'situation', choixId: null, resultats: { ...etat.resultats, [etape.id]: vide } }
      }
      const resultats = { ...etat.resultats }
      delete resultats[etape.id]
      return { ...etat, phase: 'situation', choixId: null, resultats }
    }
    case 'passer': {
      if (etape.type !== 'scenario' && etape.type !== 'lieu') return refuser()
      // Un lieu passé garde ses essais : un piège déjà essayé compte toujours pour les badges.
      const base = resultatVide(etape)
      const resultat: ChoixResultat =
        base.type === 'lieu' ? { ...base, essais: essaisDe(etat.resultats[etape.id]), passe: true } : { ...base, passe: true }
      return suivante(mission, etat, { ...etat.resultats, [etape.id]: resultat })
    }
    case 'minijeu-termine': {
      if (etape.type !== 'minijeu') return refuser()
      return suivante(mission, etat, {
        ...etat.resultats,
        [etape.id]: { type: 'minijeu', reussites: evenement.reussites, erreurs: evenement.erreurs },
      })
    }
    case 'fil-termine': {
      if (etape.type !== 'fil') return refuser()
      const manquantes = etape.notifications.filter((n) => !evenement.actions[n.id])
      if (manquantes.length) {
        throw new RunError(`notifications sans action : ${manquantes.map((n) => n.id).join(', ')}`)
      }
      const surprise = etape.notifications.find((n) => n.surprise)
      return suivante(mission, etat, {
        ...etat.resultats,
        [etape.id]: {
          type: 'fil',
          actions: { ...evenement.actions },
          surprise: surprise ? surpriseResultat(evenement.actions[surprise.id]!) : null,
        },
      })
    }
  }
}

export function resultatSurprise(etat: RunState): SurpriseResultat | null {
  for (const r of Object.values(etat.resultats)) if (r.type === 'fil' && r.surprise) return r.surprise
  return null
}

export function choixDuRun(etat: RunState): Record<string, string> {
  const choix: Record<string, string> = {}
  for (const [id, r] of Object.entries(etat.resultats)) {
    if ((r.type === 'scenario' || r.type === 'lieu') && r.choixId) choix[id] = r.choixId
  }
  return choix
}

/** Leviers choisis pendant la mission, dans l'ordre où ils ont été choisis, sans doublon (même après « rejouer »). */
export function leviersDuRun(_mission: Mission, etat: RunState): ReponseLevier[] {
  return [...etat.leviersCedes]
}

/** Leviers travaillés par la mission (blocs « pourquoi »), dans l'ordre d'apparition, sans doublon. */
export function leviersDeLaMission(mission: Mission): LevierId[] {
  const leviers: LevierId[] = []
  for (const e of mission.etapes) {
    if (e.type !== 'scenario' && e.type !== 'lieu') continue
    for (const p of e.pourquoi ?? []) if (!leviers.includes(p.levier)) leviers.push(p.levier)
  }
  return leviers
}
