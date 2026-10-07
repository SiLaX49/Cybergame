import { ILES_INFO, type IleId } from '@/parcours/iles'

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

export function nomIle(themeId: string): string | undefined {
  if (estIleCalme(themeId)) return ILES_CALMES_INFO[themeId].nom
  return (ILES_INFO as Record<string, { nom: string } | undefined>)[themeId]?.nom
}

/** Positions (en % du cadre 16:10) du centre de chaque île en mise en page large. */
export const POSITIONS_LARGES: Record<IleId | IleCalmeId | 'port', { x: number; y: number }> = {
  port: { x: 8, y: 82 },
  phishing: { x: 16, y: 50 },
  comptes: { x: 32, y: 20 },
  'vie-privee': { x: 50, y: 42 },
  'jeux-achats': { x: 66, y: 16 },
  desinformation: { x: 82, y: 38 },
  appareils: { x: 62, y: 70 },
  harcelement: { x: 84, y: 78 },
  rencontres: { x: 94, y: 62 },
}
