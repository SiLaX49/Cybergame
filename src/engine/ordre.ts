/** Empreinte FNV-1a 32 bits : petite, rapide et stable d'un navigateur à l'autre. */
export function empreinte(texte: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

/**
 * Ordre d'affichage stable des choix ou des indices d'un scénario : mélangé (le contenu les écrit toujours
 * dans le même ordre), mais identique d'une partie à l'autre et entre la version en ligne et la version papier.
 */
export function ordreAffichage<T extends { id: string }>(items: readonly T[], graine: string): T[] {
  return items
    .map((item) => ({ item, cle: empreinte(`${graine}:${item.id}`) }))
    .sort((a, b) => a.cle - b.cle || a.item.id.localeCompare(b.item.id))
    .map(({ item }) => item)
}
