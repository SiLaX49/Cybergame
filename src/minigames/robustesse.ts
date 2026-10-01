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
  { id: 'suite', libelle: 'Pas de suite connue (1234, azerty…)' },
  { id: 'interdit', libelle: 'Pas de prénom, de pseudo ni de date' },
  { id: 'repetition', libelle: 'Pas le même caractère trois fois de suite' },
] as const

export const EXEMPLE_PHRASE = 'girafe-violette-sous-la-pluie'

const SUITES = /(0123|1234|2345|3456|4567|5678|6789|abcd|azerty|qwerty|motdepasse|password|soleil|loulou)/i
const sansAccent = (t: string) => t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Estimation volontairement simple et pédagogique, calculée localement ; rien n’est enregistré. */
export function evaluerRobustesse(mdp: string, interdits: readonly string[] = []) {
  const caracteres = [...mdp]
  const longueur = caracteres.length
  const mots = mdp.split(/[\s\-_.]+/).filter((m) => [...m].length >= 3).length
  const normalise = sansAccent(mdp)
  const ok = {
    longueur: longueur >= 12,
    mots: mots >= 3,
    suite: !SUITES.test(mdp),
    interdit: !interdits.some((i) => sansAccent(i).trim() !== '' && normalise.includes(sansAccent(i).trim())),
    repetition: !/(.)\1\1/u.test(mdp),
  }
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d\s]/].filter((r) => r.test(mdp)).length
  const variee = ok.mots || classes >= 3
  // Une longue phrase faite d'un seul mot répété n'est pas une phrase de passe.
  const motsDistincts = new Set(mdp.toLowerCase().split(/[\s\-_.]+/).filter(Boolean)).size

  let niveau: NiveauRobustesse
  if (longueur < 8) niveau = 'tres-faible'
  else if (!ok.suite || !ok.interdit || !ok.repetition || (mots >= 3 && motsDistincts < 3)) niveau = 'faible'
  else if (longueur < 12) niveau = classes >= 2 ? 'moyen' : 'faible'
  else if (longueur < 16) niveau = variee ? 'solide' : 'moyen'
  else niveau = variee ? 'tres-solide' : 'solide'

  return {
    niveau,
    temps: TEMPS[niveau],
    conseils: CONSEILS.map((c) => ({ id: c.id, libelle: c.libelle, ok: ok[c.id] })),
  }
}

export const atteint = (niveau: NiveauRobustesse, objectif: NiveauRobustesse) =>
  NIVEAUX.indexOf(niveau) >= NIVEAUX.indexOf(objectif)
