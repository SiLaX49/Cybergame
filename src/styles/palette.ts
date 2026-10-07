/**
 * Source de vérité des couleurs. tokens.css reprend exactement ces valeurs
 * (vérifié par tests/unit/palette.test.ts, qui contrôle aussi les contrastes).
 */
export const THEMES_COULEURS = [
  'phishing', 'comptes', 'vie-privee', 'jeux-achats', 'desinformation', 'appareils', 'harcelement', 'rencontres',
] as const
export type ThemeCouleur = (typeof THEMES_COULEURS)[number]

export const CLAIR: Record<string, string> = {
  fond: '#fff8ec',
  surface: '#ffffff',
  'surface-2': '#f6f1ff',
  texte: '#1f1a3a',
  'texte-doux': '#544d6e',
  bord: '#e8e1f5',
  'bord-fort': '#8a80a8',
  primaire: '#5b3df5',
  'primaire-ombre': '#3b23b8',
  'primaire-texte': '#ffffff',
  bon: '#0f6b3a',
  risque: '#b3261e',
  aide: '#7a4f00',
  'bon-fond': '#e3f6ea',
  'risque-fond': '#fde8e6',
  'aide-fond': '#fff1d6',
  focus: '#b35c00',
  'focus-lisere': '#1f1a3a',
  'hulotte-corps': '#8a6bd1',
  'hulotte-ventre': '#e9defc',
  'hulotte-oeil': '#ffffff',
  'hulotte-pupille': '#1f1a3a',
  'hulotte-bec': '#ffb627',
  'accent-phishing': '#0f8a7a',
  'teinte-phishing': '#d8f3ef',
  'accent-comptes': '#5b3df5',
  'teinte-comptes': '#ece6ff',
  'accent-vie-privee': '#c92a62',
  'teinte-vie-privee': '#ffe3ef',
  'accent-jeux-achats': '#c4480a',
  'teinte-jeux-achats': '#ffe6d6',
  'accent-desinformation': '#8a6a00',
  'teinte-desinformation': '#fff3c4',
  'accent-appareils': '#1971c2',
  'teinte-appareils': '#dbeafe',
  'accent-harcelement': '#b8400c',
  'teinte-harcelement': '#ffedd5',
  'accent-rencontres': '#2b8a3e',
  'teinte-rencontres': '#dcfce7',
}

export const SOMBRE: Record<string, string> = {
  fond: '#151226',
  surface: '#221d3b',
  'surface-2': '#2a2448',
  texte: '#f4f1ff',
  'texte-doux': '#c9c2e8',
  bord: '#3a3360',
  'bord-fort': '#8a80b8',
  primaire: '#9d8bff',
  'primaire-ombre': '#6b56e0',
  'primaire-texte': '#151226',
  bon: '#6ee7a0',
  risque: '#ff8a80',
  aide: '#ffc857',
  'bon-fond': '#173a2a',
  'risque-fond': '#3f1d22',
  'aide-fond': '#3a2e12',
  focus: '#ffb347',
  'focus-lisere': '#151226',
  'hulotte-corps': '#a78bfa',
  'hulotte-ventre': '#3b3266',
  'hulotte-oeil': '#ffffff',
  'hulotte-pupille': '#151226',
  'hulotte-bec': '#ffb627',
  'accent-phishing': '#2dd4bf',
  'teinte-phishing': '#123f3a',
  'accent-comptes': '#9d8bff',
  'teinte-comptes': '#2e2752',
  'accent-vie-privee': '#f06595',
  'teinte-vie-privee': '#4a1730',
  'accent-jeux-achats': '#ff922b',
  'teinte-jeux-achats': '#4a2414',
  'accent-desinformation': '#fcc419',
  'teinte-desinformation': '#3d3210',
  'accent-appareils': '#4dabf7',
  'teinte-appareils': '#13304d',
  'accent-harcelement': '#ff8a4c',
  'teinte-harcelement': '#47220f',
  'accent-rencontres': '#69db7c',
  'teinte-rencontres': '#143d22',
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

/** Ratio de contraste WCAG 2 entre deux couleurs #rrggbb. */
export function ratioContraste(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}
