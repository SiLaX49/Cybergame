import { CHEMIN, infoIle } from '@/archipel/archipel'
import { etatIle } from '@/archipel/progression'
import { getTheme, missionsPour, toutesLesMissions } from '@/content'
import type { Mission, Tranche } from '@/content/schema'
import { defiDuJour } from '@/engine/portefeuille'

/** Mission du défi du jour pour la tranche, ou `undefined` s’il n’y a rien à proposer. */
export function defiPour(tranche: Tranche, date: string): Mission | undefined {
  const missions = toutesLesMissions().filter((m) => m.tranches.includes(tranche))
  const id = defiDuJour(missions, (theme) => getTheme(theme)?.sensible ?? false, date)
  return missions.find((m) => m.id === id)
}

export interface IleEnCours {
  theme: string
  nom: string
  titre: string
  missions: Mission[]
  terminees: number
  total: number
}

/** L’île à poursuivre : la première île du chemin qui n’est pas terminée (sinon la dernière jouable). */
export function ileEnCours(tranche: Tranche, faites: Record<string, { termineeLe: string }>): IleEnCours | null {
  let derniere: IleEnCours | null = null
  for (const theme of CHEMIN) {
    const t = getTheme(theme)
    const info = infoIle(theme)
    // Parcours d’abord, comme sur la page de l’île.
    const toutes = missionsPour(tranche, theme)
    const missions = [...toutes.filter((m) => m.format === 'parcours'), ...toutes.filter((m) => m.format !== 'parcours')]
    if (!t || !info || missions.length === 0) continue
    const e = etatIle(missions, faites, false)
    const ile = { theme, nom: info.nom, titre: t.titre, missions, terminees: e.terminees, total: e.total }
    if (!e.complete) return ile
    derniere = ile
  }
  return derniere
}

export interface RangIle {
  theme: string
  nom: string
  emoji: string
  octets: number
}

/** Classement de tes îles par octets gagnés (le seul classement du jeu : contre toi-même, jamais contre les autres). */
export function classementIles(tranche: Tranche, octets: Record<string, number>): RangIle[] {
  return CHEMIN.flatMap((theme): RangIle[] => {
    const info = infoIle(theme)
    const missions = missionsPour(tranche, theme)
    if (!info || missions.length === 0) return []
    return [{ theme, nom: info.nom, emoji: info.objet.emoji, octets: missions.reduce((s, m) => s + (octets[m.id] ?? 0), 0) }]
  }).sort((a, b) => b.octets - a.octets)
}
