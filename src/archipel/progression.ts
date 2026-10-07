import type { Mission } from '@/content/schema'
import { ILES_INFO } from '@/parcours/iles'

type Faites = Record<string, { termineeLe: string }>

export interface EtatIle {
  terminees: number
  total: number
  /** L’île a un parcours dans la tranche (donc un objet à gagner). */
  aParcours: boolean
  objetGagne: boolean
  /** Toutes les missions de la tranche sont faites (jamais pour une île calme ou vide). */
  complete: boolean
}

/** État d’une île pour la tranche courante ; `missions` = missionsPour(tranche, theme). */
export function etatIle(missions: Pick<Mission, 'id' | 'format'>[], faites: Faites, calme: boolean): EtatIle {
  const terminees = missions.filter((m) => m.id in faites).length
  const parcours = calme ? [] : missions.filter((m) => m.format === 'parcours')
  return {
    terminees,
    total: missions.length,
    aParcours: parcours.length > 0,
    objetGagne: parcours.length > 0 && parcours.every((m) => m.id in faites),
    complete: !calme && missions.length > 0 && terminees === missions.length,
  }
}

/** Thème de la dernière mission terminée parmi `missions` (celles de la tranche), sinon le port. */
export function positionPersonnage(missions: Pick<Mission, 'id' | 'theme'>[], faites: Faites): string | 'port' {
  let meilleure: { theme: string; quand: string } | null = null
  for (const m of missions) {
    const f = faites[m.id]
    if (!f || !m.theme) continue
    if (!meilleure || f.termineeLe > meilleure.quand) meilleure = { theme: m.theme, quand: f.termineeLe }
  }
  return meilleure?.theme ?? 'port'
}

export interface ObjetSacoche {
  theme: string
  emoji: string
  nom: string
  gagne: boolean
}

/** Objets de la sacoche : une entrée par île à parcours dans la tranche, dans l’ordre donné. */
export function objetsSacoche(
  iles: { theme: string; missions: Pick<Mission, 'id' | 'format'>[] }[],
  faites: Faites,
): ObjetSacoche[] {
  const infos = ILES_INFO as Record<string, { objet: { emoji: string; nom: string } } | undefined>
  const objets: ObjetSacoche[] = []
  for (const { theme, missions } of iles) {
    const info = infos[theme]
    const etat = etatIle(missions, faites, false)
    if (info && etat.aParcours) objets.push({ theme, emoji: info.objet.emoji, nom: info.objet.nom, gagne: etat.objetGagne })
  }
  return objets
}
