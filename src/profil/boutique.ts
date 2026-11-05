import type { DessinObjet } from '@/ui/dessins'

/** Catalogue de la boutique : des titres et des écussons, achetés avec les octets gagnés. Rien de payant. */
export interface ObjetBoutique {
  id: string
  type: 'titre' | 'ecusson'
  nom: string
  /** Dessin décoratif ; les lecteurs d’écran lisent seulement `nom`. */
  dessin: DessinObjet
  prix: number
}

export const BOUTIQUE: readonly ObjetBoutique[] = [
  { id: 'titre-apprenti', type: 'titre', nom: 'Apprenti·e prudent·e', dessin: 'toque', prix: 50 },
  { id: 'titre-detective', type: 'titre', nom: 'Cyber-détective', dessin: 'chapeau', prix: 150 },
  { id: 'titre-gardien', type: 'titre', nom: 'Gardien·ne des mots de passe', dessin: 'cle', prix: 300 },
  { id: 'titre-reparateur', type: 'titre', nom: 'As de la réparation', dessin: 'boite-outils', prix: 400 },
  { id: 'titre-expert', type: 'titre', nom: 'Expert·e cyber', dessin: 'medaille', prix: 700 },
  { id: 'ecusson-bouclier', type: 'ecusson', nom: 'Écusson bouclier', dessin: 'bouclier', prix: 80 },
  { id: 'ecusson-cadenas', type: 'ecusson', nom: 'Écusson cadenas', dessin: 'cadenas', prix: 100 },
  { id: 'ecusson-loupe', type: 'ecusson', nom: 'Écusson loupe', dessin: 'loupe', prix: 120 },
  { id: 'ecusson-eclair', type: 'ecusson', nom: 'Écusson éclair', dessin: 'eclair', prix: 200 },
  { id: 'ecusson-hulotte', type: 'ecusson', nom: 'Écusson hulotte d’or', dessin: 'hulotte', prix: 250 },
  { id: 'ecusson-fusee', type: 'ecusson', nom: 'Écusson fusée', dessin: 'fusee', prix: 350 },
  { id: 'ecusson-trophee', type: 'ecusson', nom: 'Écusson trophée', dessin: 'trophee', prix: 500 },
]

export const objetBoutique = (id: string): ObjetBoutique | undefined => BOUTIQUE.find((o) => o.id === id)
