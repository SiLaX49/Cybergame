export type Echeance = 'J+7' | 'J+30'

const JOUR_MS = 86_400_000

/** Rappel à proposer : J+7 après la première mission terminée, puis J+30 une fois le premier rappel fait. */
export function rappelDu(datesTerminees: string[], rappelsFaits: number, maintenant: Date): Echeance | null {
  const dates = datesTerminees.map((d) => Date.parse(d)).filter(Number.isFinite)
  if (!dates.length) return null
  const jours = (maintenant.getTime() - Math.min(...dates)) / JOUR_MS
  if (rappelsFaits === 0 && jours >= 7) return 'J+7'
  if (rappelsFaits === 1 && jours >= 30) return 'J+30'
  return null
}
