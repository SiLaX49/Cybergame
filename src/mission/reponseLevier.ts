import type { Leviers, Qualite, ReponseLevier, Scenario } from '@/content/schema'

/**
 * Ce qui a marché sur l’élève : le levier qu’il a choisi, le « truc » de la situation et sa parade.
 * En thème sensible, « Autre chose » reçoit une réponse sans vocabulaire d’arnaque (`autreSensible`).
 */
export function reponseLevier(
  pourquoi: Scenario['pourquoi'],
  levier: ReponseLevier | null,
  leviers: Leviers,
  sensible = false,
): { libelle: string; truc: string; parade: string } | null {
  if (!levier) return null
  if (levier === 'autre') {
    const { truc, parade } = sensible ? leviers.autreSensible : leviers.autre
    return { libelle: leviers.autre.libelle, truc, parade }
  }
  const p = pourquoi?.find((x) => x.levier === levier)
  return p ? { libelle: leviers.leviers[levier].libelle, truc: p.truc, parade: p.parade } : null
}

/** Titre du bloc qui répond à la raison choisie : neutre en thème sensible, où l’élève n’est pas « piégé ». */
export const titreReponse = (sensible: boolean) => (sensible ? 'Ce qui a pu peser' : 'Ce qui a marché sur toi')

export const VERDICTS: Record<Qualite, { icone: string; titre: string }> = {
  bon: { icone: '✅', titre: 'Bon réflexe !' },
  aide: { icone: '🤝', titre: 'Demander de l’aide, c’est toujours une bonne idée.' },
  risque: { icone: '⚠️', titre: 'C’était risqué. Voyons ce qui se passe.' },
}
