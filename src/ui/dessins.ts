/** Objets à collectionner (sacoche, boutique, écussons), dessinés à plat dans le style des îles. */
export const DESSINS = [
  'bouclier',
  'coffre-fort',
  'cape',
  'trophee',
  'loupe',
  'antenne',
  'toque',
  'chapeau',
  'cle',
  'boite-outils',
  'medaille',
  'cadenas',
  'eclair',
  'hulotte',
  'fusee',
] as const
export type DessinObjet = (typeof DESSINS)[number]
