/**
 * Source de vérité des couleurs. tokens.css reprend exactement ces valeurs
 * (vérifié par tests/unit/palette.test.ts, qui contrôle aussi les contrastes).
 */
export const THEMES_COULEURS = [
  'phishing', 'comptes', 'vie-privee', 'jeux-achats', 'desinformation', 'appareils', 'harcelement', 'rencontres',
] as const
export type ThemeCouleur = (typeof THEMES_COULEURS)[number]

export const CLAIR: Record<string, string> = {
  fond: '#f6f7fc',
  surface: '#ffffff',
  'surface-2': '#f2f4ff',
  texte: '#0b1020',
  'texte-doux': '#4a5578',
  bord: '#e7e9f2',
  'bord-fort': '#6f7a9e',
  primaire: '#4a5ff5',
  'primaire-2': '#6e4ff5',
  'primaire-ombre': '#3144b4',
  'primaire-texte': '#ffffff',
  bon: '#0f6b3a',
  risque: '#b3261e',
  aide: '#7a4f00',
  'bon-fond': '#e3f6ea',
  'risque-fond': '#fde8e6',
  'aide-fond': '#fff1d6',
  focus: '#b35c00',
  'focus-lisere': '#0b1020',
  'hulotte-corps': '#8a6bd1',
  'hulotte-ventre': '#e9defc',
  'hulotte-oeil': '#ffffff',
  mer: '#bfe6f5',
  'mer-profonde': '#8ccbe6',
  ecume: '#ffffff',
  'hulotte-pupille': '#0b1020',
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
  or: '#7a5000',
  'or-fond': '#fff1d0',
  'tuile-a': '#4a5ff5',
  'tuile-b': '#6e4ff5',
  'tuile-c': '#0b7268',
  'tuile-texte': '#ffffff',
  'agent-uniforme': '#2f7de1',
  'agent-ombre': '#1d4f9e',
  'agent-or': '#f5b72e',
  'agent-gant': '#173a7a',
}

export const SOMBRE: Record<string, string> = {
  fond: '#0b1020',
  surface: '#141a33',
  'surface-2': '#1c2446',
  texte: '#f2f4ff',
  'texte-doux': '#b4bddb',
  bord: '#262f55',
  'bord-fort': '#7d89b8',
  primaire: '#8f9cff',
  'primaire-2': '#b39bff',
  'primaire-ombre': '#5a68e0',
  'primaire-texte': '#0b1020',
  bon: '#6ee7a0',
  risque: '#ff8a80',
  aide: '#ffc857',
  'bon-fond': '#123a2c',
  'risque-fond': '#3d1a26',
  'aide-fond': '#3a2e14',
  focus: '#ffb347',
  'focus-lisere': '#0b1020',
  'hulotte-corps': '#a78bfa',
  'hulotte-ventre': '#2e3f73',
  'hulotte-oeil': '#ffffff',
  mer: '#13305a',
  'mer-profonde': '#0b1f40',
  ecume: '#4a6f93',
  'hulotte-pupille': '#0b1020',
  'hulotte-bec': '#ffb627',
  'accent-phishing': '#2dd4bf',
  'teinte-phishing': '#123f3a',
  'accent-comptes': '#9d8bff',
  'teinte-comptes': '#262a5c',
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
  or: '#ffc94d',
  'or-fond': '#3a2f10',
  'tuile-a': '#4a5ff5',
  'tuile-b': '#6e4ff5',
  'tuile-c': '#0b7268',
  'tuile-texte': '#ffffff',
  'agent-uniforme': '#2f7de1',
  'agent-ombre': '#1d4f9e',
  'agent-or': '#f5b72e',
  'agent-gant': '#173a7a',
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
