/** Registre des applis fictives du faux téléphone. Sans Vue : le schéma du contenu le lit côté node. */
export interface Appli {
  /** Égal à l’`appNom` du contenu. */
  nom: string
  marque: 'snaptalk' | 'chatcord' | 'streamtube' | 'revendo' | 'gamebox' | 'banquenova' | 'ent' | 'messages' | 'mail' | 'navigateur' | 'magasin' | 'meteo'
  /** Couleur de la marque (spec, section 4.3). */
  accent: string
  /** Couleur du texte et de l’icône sur l’accent : la plus contrastée, au moins 4.5:1. */
  texteSurAccent: '#ffffff' | '#1b1b2f'
  /** Nom d’icône lucide, résolu dans `IconeAppli`. */
  icone: string
  /** Applis réelles évoquées (documentation, jamais affiché). */
  evoque: string
}

const BLANC = '#ffffff'
const FONCE = '#1b1b2f'

const LISTE: Appli[] = [
  { nom: 'SnapTalk', marque: 'snaptalk', accent: '#FFC83D', texteSurAccent: FONCE, icone: 'Aperture', evoque: 'Snapchat, Instagram' },
  { nom: 'ChatCord', marque: 'chatcord', accent: '#7B4DDB', texteSurAccent: BLANC, icone: 'MessagesSquare', evoque: 'Discord' },
  // Spec : #E8344E (4.17:1 au mieux), assombri à même teinte pour atteindre 4.5:1 avec le blanc.
  { nom: 'StreamTube', marque: 'streamtube', accent: '#E6223E', texteSurAccent: BLANC, icone: 'Clapperboard', evoque: 'YouTube, TikTok' },
  // Spec : #2F8F5B (4.18:1 au mieux), assombri à même teinte.
  { nom: 'Revendo', marque: 'revendo', accent: '#2C8655', texteSurAccent: BLANC, icone: 'ShoppingBag', evoque: 'Vinted, Leboncoin' },
  { nom: 'GameBox', marque: 'gamebox', accent: '#FF7A1A', texteSurAccent: FONCE, icone: 'Gamepad2', evoque: 'Roblox, Fortnite' },
  { nom: 'GameBox Chat', marque: 'gamebox', accent: '#FF7A1A', texteSurAccent: FONCE, icone: 'MessageSquareText', evoque: 'Roblox, Fortnite' },
  { nom: 'BanqueNova', marque: 'banquenova', accent: '#2D3A8C', texteSurAccent: BLANC, icone: 'Landmark', evoque: 'appli bancaire' },
  // Spec : #3B82C4 (4.16:1 au mieux), assombri à même teinte.
  { nom: 'Mon Collège', marque: 'ent', accent: '#387AB9', texteSurAccent: BLANC, icone: 'School', evoque: 'ENT' },
  { nom: 'Mon Lycée', marque: 'ent', accent: '#387AB9', texteSurAccent: BLANC, icone: 'GraduationCap', evoque: 'ENT' },
  { nom: 'Messages', marque: 'messages', accent: '#0E9F8E', texteSurAccent: FONCE, icone: 'MessageCircle', evoque: 'SMS' },
  { nom: 'Mail', marque: 'mail', accent: '#4A6FA5', texteSurAccent: BLANC, icone: 'Inbox', evoque: 'Gmail, Apple Mail' },
  { nom: 'Navigateur', marque: 'navigateur', accent: '#5A6B7D', texteSurAccent: BLANC, icone: 'Globe', evoque: 'Chrome, Safari' },
  { nom: 'Magasin d’applis', marque: 'magasin', accent: '#2A9DF4', texteSurAccent: FONCE, icone: 'Store', evoque: 'App Store, Play Store' },
  { nom: 'Météo', marque: 'meteo', accent: '#4BA3D9', texteSurAccent: FONCE, icone: 'CloudSun', evoque: 'appli météo' },
]

export const APPLIS: Record<string, Appli> = Object.fromEntries(LISTE.map((a) => [a.nom, a]))

export const NOMS_APPLIS = LISTE.map((a) => a.nom) as [string, ...string[]]

export const appli = (nom: string): Appli => {
  const a = APPLIS[nom]
  if (!a) throw new Error(`Appli inconnue du registre : « ${nom} »`)
  return a
}
