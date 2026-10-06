import { empreinte } from '@/engine/ordre'

/** Initiales des deux premiers mots qui commencent par une lettre ; vide pour un numéro. */
export function initiales(nom: string): string {
  const mots = nom.replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ').filter((m) => /^\p{L}/u.test(m))
  if (mots.length === 0) return ''
  if (mots.length === 1) return [...mots[0]!].slice(0, 2).join('').toUpperCase()
  return ([...mots[0]!][0]! + [...mots[1]!][0]!).toUpperCase()
}

/** Teinte stable d'un nom, pour la couleur de son avatar. */
export const teinte = (nom: string): number => empreinte(nom) % 360
