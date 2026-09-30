import type { ContentBundle, Tranche } from './schema'

export function creerAcces(bundle: ContentBundle) {
  return {
    contenu: bundle,
    getThemes: () => bundle.themes,
    getTheme: (id: string) => bundle.themes.find((t) => t.id === id),
    getLeviers: () => bundle.leviers,
    getMission: (id: string) => bundle.missions.find((m) => m.id === id),
    missionsPour: (tranche: Tranche, themeId: string) =>
      bundle.missions.filter((m) => m.type === 'mission' && m.theme === themeId && m.tranches.includes(tranche)),
    rappelPour: (tranche: Tranche) => bundle.missions.find((m) => m.type === 'rappel' && m.tranches.includes(tranche)),
    toutesLesMissions: () => bundle.missions,
  }
}
