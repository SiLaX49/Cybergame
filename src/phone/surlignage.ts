import type { InjectionKey, Ref } from 'vue'
import { decouperLiens } from './liens'

export interface Passage { texte: string; numero: number | null }
/** Passages à surligner, fournis par le téléphone à ses applis (lus par `TexteRiche`). */
export const CLE_PASSAGES: InjectionKey<Readonly<Ref<readonly Passage[]>>> = Symbol('passages')
export type MorceauRiche =
  | { type: 'texte' | 'lien'; texte: string }
  | { type: 'passage'; texte: string; numero: number | null }

/**
 * Découpe un texte en morceaux : passages à surligner (première occurrence, sans chevauchement, dans l'ordre
 * du texte), puis liens repérés dans le reste. Un passage introuvable est ignoré.
 */
export function decouperTexte(texte: string, passages: readonly Passage[]): MorceauRiche[] {
  // Zones trouvées, triées par position ; à égalité, l'ordre donné est conservé (tri stable).
  const zones = passages
    .map((p) => ({ ...p, debut: p.texte ? texte.indexOf(p.texte) : -1 }))
    .filter((z) => z.debut >= 0)
    .sort((a, b) => a.debut - b.debut)
  const morceaux: MorceauRiche[] = []
  let curseur = 0
  for (const z of zones) {
    if (z.debut < curseur) continue // chevauche une zone déjà retenue : ignorée
    morceaux.push(...decouperLiens(texte.slice(curseur, z.debut)))
    morceaux.push({ type: 'passage', texte: z.texte, numero: z.numero })
    curseur = z.debut + z.texte.length
  }
  morceaux.push(...decouperLiens(texte.slice(curseur)))
  return morceaux
}
