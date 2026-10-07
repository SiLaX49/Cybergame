import type { ChoixResultat, FilResultat, LieuResultat, RunState, ScenarioResultat } from './mission-runner'

export const BADGES = {
  'mission-accomplie': { titre: 'Mission accomplie', description: 'Tu es allé·e jusqu’au bout de la mission.' },
  'oeil-de-lynx': { titre: 'Œil de lynx', description: 'Tu as repéré de vrais indices sans te laisser piéger par les faux.' },
  'reflexe-verif': { titre: 'Réflexe vérif', description: 'À chaque fois, tu as vérifié ou demandé de l’aide avant d’agir.' },
  reparateur: { titre: 'Réparateur·rice', description: 'Tu as appliqué les bons gestes pour limiter les dégâts.' },
  vigilant: { titre: 'Vigilant·e', description: 'Tu n’es pas tombé·e dans le piège glissé parmi tes notifications.' },
  explorateur: { titre: 'Explorateur·rice', description: 'Tu as traversé toute l’île, lieu après lieu.' },
} as const

export type BadgeId = keyof typeof BADGES

export function calculerBadges(etat: RunState): BadgeId[] {
  if (!etat.termine) return []
  const badges: BadgeId[] = ['mission-accomplie']
  const resultats = Object.values(etat.resultats)
  const scenarios = resultats.filter((r): r is ChoixResultat => (r.type === 'scenario' || r.type === 'lieu') && !r.passe)
  const avecIndices = scenarios.filter((r): r is ScenarioResultat => r.type === 'scenario' && r.levier === null)
  if (avecIndices.length && avecIndices.every((r) => r.indicesJustes > 0 && r.indicesFaux === 0)) badges.push('oeil-de-lynx')
  // Un piège essayé dans un lieu, même passé ensuite, empêche « Réflexe vérif » (rien ne change pour les scénarios).
  const piegeEssaye = resultats.some((r) => r.type === 'lieu' && r.essais.length > 0)
  if (scenarios.length && !piegeEssaye && scenarios.every((r) => r.qualite !== 'risque')) badges.push('reflexe-verif')
  if (scenarios.some((r) => r.recuperationFaite === true)) badges.push('reparateur')
  const fils = resultats.filter((r): r is FilResultat => r.type === 'fil' && r.surprise !== null)
  if (fils.length && fils.every((r) => r.surprise !== 'piege')) badges.push('vigilant')
  const lieux = resultats.filter((r): r is LieuResultat => r.type === 'lieu')
  if (lieux.length && lieux.every((r) => !r.passe)) badges.push('explorateur')
  return badges
}

/** Descriptions sans vocabulaire de « piège » pour les thèmes sensibles : l’élève n’y est pas un joueur à piéger. */
const DESCRIPTIONS_SENSIBLES: Partial<Record<BadgeId, string>> = {
  'oeil-de-lynx': 'Tu as repéré de vrais indices sans te laisser tromper par les faux.',
}

export function descriptionBadge(id: BadgeId, sensible = false): string {
  return (sensible && DESCRIPTIONS_SENSIBLES[id]) || BADGES[id].description
}
