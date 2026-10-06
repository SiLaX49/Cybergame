import type { PersonnageId } from '@/store/progress'

export interface Personnage {
  id: PersonnageId
  libelle: string
  peau: string
  cheveux: string
  haut: string
  coiffure: 'boucles' | 'courts' | 'longs' | 'chignon'
}

export const PERSONNAGES_INFO: Record<PersonnageId, Personnage> = {
  p1: { id: 'p1', libelle: 'Cheveux bouclés, sweat orange', peau: '#8d5524', cheveux: '#2b1b0e', haut: '#ff7a59', coiffure: 'boucles' },
  p2: { id: 'p2', libelle: 'Cheveux courts, t-shirt vert', peau: '#f1c27d', cheveux: '#6b4423', haut: '#3fae6a', coiffure: 'courts' },
  p3: { id: 'p3', libelle: 'Cheveux longs, veste bleue', peau: '#e0ac69', cheveux: '#1f1f1f', haut: '#3b7dd8', coiffure: 'longs' },
  p4: { id: 'p4', libelle: 'Chignon, pull violet', peau: '#c68642', cheveux: '#8a3b12', haut: '#8e5bd6', coiffure: 'chignon' },
}
