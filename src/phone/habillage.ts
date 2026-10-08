import { APPLIS, type Appli } from './applis'
import type { EcranTelephone } from './types'

type Marque = Appli['marque']
/** Applis à en-tête seul : même coque quel que soit le type d’écran. */
const AUTRES: Marque[] = ['banquenova', 'ent', 'meteo']
const CONVERSATION: Marque[] = ['snaptalk', 'chatcord', 'messages', 'gamebox', 'revendo', ...AUTRES]

/**
 * Marques habillées par type d’écran. `sinon` : appli qui affiche l’écran d’une marque sans coque. Toute page web
 * s’ouvre dans le navigateur (une page de hameçonnage n’est jamais habillée en appli officielle), sauf les fiches du
 * magasin d’applis du système.
 */
const HABILLAGES: Record<Exclude<EcranTelephone['app'], 'verrouillage'>, { marques: Marque[]; sinon?: string }> = {
  sms: { marques: CONVERSATION },
  chat: { marques: CONVERSATION },
  social: { marques: ['snaptalk', 'streamtube', ...AUTRES] },
  mail: { marques: ['mail', ...AUTRES] },
  web: { marques: ['navigateur', 'magasin'], sinon: 'Navigateur' },
}

/** Appli dont la coque habille l’écran (sa propre marque, ou `sinon`) ; `null` pour l’écran verrouillé et sans coque. */
export function marqueAffichee(ecran: EcranTelephone): Appli | null {
  if (ecran.app === 'verrouillage') return null
  const { marques, sinon } = HABILLAGES[ecran.app]
  const propre = APPLIS[ecran.appNom]
  if (propre && marques.includes(propre.marque)) return propre
  return (sinon && APPLIS[sinon]) || null
}
