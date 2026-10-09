/**
 * Textes propres aux thèmes sensibles, affichés autour des scénarios : lus par les composants
 * et par l’export de relecture (scripts/export-relecture.ts). Ce module n’importe rien.
 */

export const AVERTISSEMENT = {
  titre: 'Avant de commencer',
  paragraphes: [
    'Ce sujet peut être difficile. Tu peux passer un scénario à tout moment, sans aucune pénalité.',
    'Si quelque chose te rappelle une situation que tu vis, tu n’as pas à en parler devant les autres. Tu peux en parler plus tard à un adulte de confiance, ou appeler le 3018.',
  ],
  commencer: 'Commencer',
  revenir: 'Revenir à la carte',
}

export const PASSER = { scenario: 'Passer ce scénario', lieu: 'Passer ce lieu' }

/** Titre de l’étape de récupération quand l’élève joue la personne visée. */
export const TITRE_RECUPERATION_VICTIME = 'Maintenant, protège-toi'

/** Titre du bloc qui répond à la raison choisie, en thème sensible. */
export const TITRE_REPONSE_SENSIBLE = 'Ce qui a pu peser'

export const FIN_SENSIBLE = {
  titre: 'Ce qui peut faire hésiter',
  sansLevier: 'Tu as fait les bons choix cette fois. Voici ce qui peut faire hésiter :',
}
