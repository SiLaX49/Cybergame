export interface EnvPoste {
  stockage: boolean
  serviceWorker: boolean
  horsLigneActif: boolean
  largeur: number
  nbMissions: number
}

export interface VerifPoste {
  id: 'contenu' | 'ecran' | 'stockage' | 'hors-ligne'
  libelle: string
  ok: boolean
  bloquant: boolean
  conseil: string
}

export function verifierPoste(env: EnvPoste): { verifs: VerifPoste[]; pret: boolean } {
  const verifs: VerifPoste[] = [
    { id: 'contenu', libelle: 'Missions chargées', ok: env.nbMissions > 0, bloquant: true, conseil: 'Aucune mission n’a pu être chargée : recharge la page.' },
    { id: 'ecran', libelle: 'Taille d’écran suffisante', ok: env.largeur >= 320, bloquant: true, conseil: 'Écran très étroit : préfère une tablette ou un ordinateur.' },
    {
      id: 'stockage',
      libelle: 'Enregistrement de la progression',
      ok: env.stockage,
      bloquant: false,
      conseil: 'Le navigateur bloque l’enregistrement (navigation privée ?). Le jeu fonctionne, mais sans sauvegarde.',
    },
    {
      id: 'hors-ligne',
      libelle: 'Mode hors ligne',
      ok: env.serviceWorker && env.horsLigneActif,
      bloquant: false,
      conseil: env.serviceWorker
        ? 'Recharge la page une fois : le jeu sera ensuite disponible même sans réseau.'
        : 'Ce navigateur ne permet pas le mode hors ligne : il faudra rester connecté.',
    },
  ]
  return { verifs, pret: verifs.every((v) => v.ok || !v.bloquant) }
}
