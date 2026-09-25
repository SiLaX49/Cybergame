import type { DOMWrapper, VueWrapper } from '@vue/test-utils'

type Enveloppe = VueWrapper | DOMWrapper<Element>

export function bouton(w: Enveloppe, texte: string): DOMWrapper<HTMLButtonElement> {
  const trouve = w.findAll('button').find((b) => b.text().includes(texte))
  if (!trouve) throw new Error(`bouton introuvable : « ${texte} » (boutons : ${w.findAll('button').map((b) => b.text()).join(' | ')})`)
  return trouve as DOMWrapper<HTMLButtonElement>
}

export async function cliquer(w: Enveloppe, texte: string): Promise<void> {
  await bouton(w, texte).trigger('click')
}
