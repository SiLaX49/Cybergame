/** Catalogue de la boutique : des titres et des écussons, achetés avec les octets gagnés. Rien de payant. */
export interface ObjetBoutique {
  id: string
  type: 'titre' | 'ecusson'
  nom: string
  /** Emoji décoratif (écussons) ; lu par les lecteurs d’écran seulement via `nom`. */
  emoji: string
  prix: number
}

export const BOUTIQUE: readonly ObjetBoutique[] = [
  { id: 'titre-apprenti', type: 'titre', nom: 'Apprenti·e prudent·e', emoji: '🎓', prix: 50 },
  { id: 'titre-detective', type: 'titre', nom: 'Cyber-détective', emoji: '🕵️', prix: 150 },
  { id: 'titre-gardien', type: 'titre', nom: 'Gardien·ne des mots de passe', emoji: '🗝️', prix: 300 },
  { id: 'titre-reparateur', type: 'titre', nom: 'As de la réparation', emoji: '🧰', prix: 400 },
  { id: 'titre-expert', type: 'titre', nom: 'Expert·e cyber', emoji: '🏅', prix: 700 },
  { id: 'ecusson-bouclier', type: 'ecusson', nom: 'Écusson bouclier', emoji: '🛡️', prix: 80 },
  { id: 'ecusson-cadenas', type: 'ecusson', nom: 'Écusson cadenas', emoji: '🔒', prix: 100 },
  { id: 'ecusson-loupe', type: 'ecusson', nom: 'Écusson loupe', emoji: '🔎', prix: 120 },
  { id: 'ecusson-eclair', type: 'ecusson', nom: 'Écusson éclair', emoji: '⚡', prix: 200 },
  { id: 'ecusson-hulotte', type: 'ecusson', nom: 'Écusson hulotte d’or', emoji: '🦉', prix: 250 },
  { id: 'ecusson-fusee', type: 'ecusson', nom: 'Écusson fusée', emoji: '🚀', prix: 350 },
  { id: 'ecusson-trophee', type: 'ecusson', nom: 'Écusson trophée', emoji: '🏆', prix: 500 },
]

export const objetBoutique = (id: string): ObjetBoutique | undefined => BOUTIQUE.find((o) => o.id === id)
