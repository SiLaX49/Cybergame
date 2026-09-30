export type Echeance = 'J+7' | 'J+30'

const JOUR_MS = 86_400_000

/**
 * Rappel à proposer : J+7 après la première mission terminée tant qu'aucun rappel n'a été fait
 * depuis ; puis J+30 tant qu'aucun rappel n'a été fait à partir de J+30. Un rappel joué avant la
 * première mission ne compte pas.
 */
export function rappelDu(
  datesTerminees: string[],
  rappels: { faitLe: string; fois: number }[],
  maintenant: Date,
): Echeance | null {
  const dates = datesTerminees.map((d) => Date.parse(d)).filter(Number.isFinite)
  if (!dates.length) return null
  const debut = Math.min(...dates)
  const jours = (maintenant.getTime() - debut) / JOUR_MS
  const faitsDepuis = rappels.map((r) => Date.parse(r.faitLe)).filter((t) => Number.isFinite(t) && t >= debut)
  if (!faitsDepuis.length) return jours >= 7 ? 'J+7' : null
  // Le J+30 est dû tant qu'aucun rappel n'a été fait à partir de J+30.
  const dernier = Math.max(...faitsDepuis)
  if (jours >= 30 && dernier < debut + 30 * JOUR_MS) return 'J+30'
  return null
}
