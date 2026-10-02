export const NIVEAUX = ['tres-faible', 'faible', 'moyen', 'solide', 'tres-solide'] as const
export type NiveauRobustesse = (typeof NIVEAUX)[number]

export const LIBELLES_NIVEAU: Record<NiveauRobustesse, string> = {
  'tres-faible': 'Très faible',
  faible: 'Faible',
  moyen: 'Moyen',
  solide: 'Solide',
  'tres-solide': 'Très solide',
}

const TEMPS: Record<NiveauRobustesse, string> = {
  'tres-faible': 'quelques secondes',
  faible: 'quelques heures',
  moyen: 'quelques mois',
  solide: 'des années',
  'tres-solide': 'des siècles',
}

export const CONSEILS = [
  { id: 'longueur', libelle: 'Au moins 12 caractères' },
  { id: 'mots', libelle: 'Plusieurs mots (au moins 3)' },
  { id: 'suite', libelle: 'Pas de suite ni de mot de passe courant (1234, azerty, soleil…)' },
  { id: 'interdit', libelle: 'Aucun mot tiré de l’énoncé (prénom, date, nom du site…)' },
  { id: 'repetition', libelle: 'Pas le même caractère trois fois de suite' },
] as const

export const EXEMPLE_PHRASE = 'girafe-violette-sous-la-pluie'

const SUITES = /(0123|1234|2345|3456|4567|5678|6789|abcd|azerty|qwerty|motdepasse|password|soleil|loulou)/i
const sansAccent = (t: string) => t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Estimation volontairement simple et pédagogique, calculée localement ; rien n’est enregistré. */
export function evaluerRobustesse(mdp: string, interdits: readonly string[] = []) {
  const caracteres = [...mdp]
  const longueur = caracteres.length
  const listeMots = mdp.split(/[\s\-_.]+/).filter((m) => [...m].length >= 3)
  const mots = listeMots.length
  // Une longue phrase faite d’un seul mot répété n’est pas une phrase de passe.
  const motsDistincts = new Set(listeMots.map(sansAccent)).size
  const normalise = sansAccent(mdp)
  const ok = {
    longueur: longueur >= 12,
    mots: mots >= 3 && motsDistincts >= 3,
    suite: !SUITES.test(mdp),
    interdit: !interdits.some((i) => sansAccent(i).trim() !== '' && normalise.includes(sansAccent(i).trim())),
    repetition: !/(.)\1\1/u.test(mdp),
  }
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d\s]/].filter((r) => r.test(mdp)).length

  let niveau: NiveauRobustesse
  if (longueur < 8) niveau = 'tres-faible'
  else if (!ok.suite || !ok.interdit || !ok.repetition || (mots >= 3 && motsDistincts < 3)) niveau = 'faible'
  else if (longueur < 12) niveau = classes >= 2 ? 'moyen' : 'faible'
  // Seule une vraie phrase de passe (3 mots différents) atteint « solide » puis « très solide » :
  // mélanger majuscules, chiffres et symboles dans un seul mot fait seulement monter d’un cran.
  else if (longueur < 16) niveau = ok.mots ? 'solide' : classes >= 3 ? 'moyen' : 'faible'
  else niveau = ok.mots ? 'tres-solide' : classes >= 3 ? 'solide' : 'moyen'

  return {
    niveau,
    temps: TEMPS[niveau],
    conseils: CONSEILS.map((c) => ({ id: c.id, libelle: c.libelle, ok: ok[c.id] })),
  }
}

export const atteint = (niveau: NiveauRobustesse, objectif: NiveauRobustesse) =>
  NIVEAUX.indexOf(niveau) >= NIVEAUX.indexOf(objectif)
