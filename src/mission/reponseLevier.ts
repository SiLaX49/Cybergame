import type { Leviers, Qualite, ReponseLevier, Scenario } from '@/content/schema'

/** Ce qui a marché sur l’élève : le levier qu’il a choisi, le « truc » de la situation et sa parade. */
export function reponseLevier(
  pourquoi: Scenario['pourquoi'],
  levier: ReponseLevier | null,
  leviers: Leviers,
): { libelle: string; truc: string; parade: string } | null {
  if (!levier) return null
  if (levier === 'autre') return { libelle: leviers.autre.libelle, truc: leviers.autre.truc, parade: leviers.autre.parade }
  const p = pourquoi?.find((x) => x.levier === levier)
  return p ? { libelle: leviers.leviers[levier].libelle, truc: p.truc, parade: p.parade } : null
}

export const VERDICTS: Record<Qualite, { icone: string; titre: string }> = {
  bon: { icone: '✅', titre: 'Bon réflexe !' },
  aide: { icone: '🤝', titre: 'Demander de l’aide, c’est toujours une bonne idée.' },
  risque: { icone: '⚠️', titre: 'C’était risqué. Voyons ce qui se passe.' },
}
