import { estIle, ILES_INFO, type Ile, type IleId } from '@/parcours/iles'

/** Ordre conseillé (jamais bloquant) des îles à parcours, depuis le port. */
export const CHEMIN = ['phishing', 'comptes', 'vie-privee', 'jeux-achats', 'desinformation', 'appareils'] as const satisfies readonly IleId[]

/** Thèmes sensibles : îles calmes, à l’écart, sans objet ni fête. */
export const ILES_CALMES = ['harcelement', 'rencontres'] as const
export type IleCalmeId = (typeof ILES_CALMES)[number]
export const estIleCalme = (id: string): id is IleCalmeId => (ILES_CALMES as readonly string[]).includes(id)

export const ILES_CALMES_INFO: Record<IleCalmeId, { nom: string; herbe: string; terre: string; repere: 'jardin' | 'phare' }> = {
  harcelement: { nom: 'Île de l’entraide', herbe: '#b9dfb0', terre: '#c9b291', repere: 'jardin' },
  rencontres: { nom: 'Île du phare', herbe: '#cfe3c8', terre: '#d8c8a8', repere: 'phare' },
}

/** Infos d’une île à parcours, ou `undefined` si `themeId` n’en est pas une (île calme, inconnu). */
export const infoIle = (themeId: string): Ile | undefined => (estIle(themeId) ? ILES_INFO[themeId] : undefined)

export function nomIle(themeId: string): string | undefined {
  if (estIleCalme(themeId)) return ILES_CALMES_INFO[themeId].nom
  return infoIle(themeId)?.nom
}

/** Positions (en % du cadre 16:10) du centre de chaque île en mise en page large. */
export const POSITIONS_LARGES: Record<IleId | IleCalmeId | 'port', { x: number; y: number }> = {
  port: { x: 8, y: 86 },
  phishing: { x: 17, y: 58 },
  comptes: { x: 30, y: 24 },
  'vie-privee': { x: 45, y: 56 },
  'jeux-achats': { x: 58, y: 24 },
  desinformation: { x: 72, y: 48 },
  appareils: { x: 56, y: 82 },
  harcelement: { x: 89, y: 70 },
  rencontres: { x: 90, y: 28 },
}
