export type Echeance = 'J+7' | 'J+30'

const JOUR_MS = 86_400_000

/**
 * Rappel à proposer : J+7 après la première mission terminée, puis J+30 une fois le premier rappel fait.
 * Seuls comptent les rappels faits après la première mission : un rappel joué « pour voir » avant
 * n'annule pas le J+7.
 */
export function rappelDu(
  datesTerminees: string[],
  rappels: { faitLe: string; fois: number }[],
  maintenant: Date,
): Echeance | null {
  const dates = datesTerminees.map((d) => Date.parse(d)).filter(Number.isFinite)
  if (!dates.length) return null
  const debut = Math.min(...dates)
  const rappelsFaits = rappels
    .filter((r) => Date.parse(r.faitLe) >= debut)
    .reduce((total, r) => total + r.fois, 0)
  const jours = (maintenant.getTime() - debut) / JOUR_MS
  if (rappelsFaits === 0 && jours >= 7) return 'J+7'
  if (rappelsFaits === 1 && jours >= 30) return 'J+30'
  return null
}
