export const ILES = ['phishing', 'jeux-achats', 'comptes', 'vie-privee', 'desinformation', 'appareils'] as const
export type IleId = (typeof ILES)[number]
export const estIle = (id: string): id is IleId => (ILES as readonly string[]).includes(id)

export interface Ile {
  nom: string
  objet: { emoji: string; nom: string }
  ciel: string
  mer: string
  herbe: string
  terre: string
  /** Petit motif répété dans le décor de fond. */
  fond: string
}

export const ILES_INFO: Record<IleId, Ile> = {
  phishing: { nom: 'Île aux hameçons', objet: { emoji: '🛡️', nom: 'le bouclier' }, ciel: '#cfe8ff', mer: '#6cbfe6', herbe: '#8fd18a', terre: '#a77b52', fond: '🍾' },
  'jeux-achats': { nom: 'Île aux pièces d’or', objet: { emoji: '🏆', nom: 'le trophée' }, ciel: '#ffe3f1', mer: '#7fb8f0', herbe: '#ffcf5c', terre: '#c0763f', fond: '🧱' },
  comptes: { nom: 'Île des clés', objet: { emoji: '🔐', nom: 'le coffre-fort' }, ciel: '#e3e7ff', mer: '#7aa7e0', herbe: '#b8c4cf', terre: '#7d7f86', fond: '🗝️' },
  'vie-privee': { nom: 'Île aux secrets', objet: { emoji: '🕶️', nom: 'la cape d’invisibilité' }, ciel: '#e9f7e6', mer: '#77c3c0', herbe: '#5fae5b', terre: '#8a6a45', fond: '🌿' },
  desinformation: { nom: 'Île aux rumeurs', objet: { emoji: '🔍', nom: 'la loupe' }, ciel: '#fff3d6', mer: '#7cc6e8', herbe: '#f2a65a', terre: '#9a6b4a', fond: '📰' },
  appareils: { nom: 'Île aux antennes', objet: { emoji: '📡', nom: 'l’antenne sûre' }, ciel: '#e0f4ff', mer: '#5fb0d8', herbe: '#9ad0f5', terre: '#6f7c88', fond: '📶' },
}
