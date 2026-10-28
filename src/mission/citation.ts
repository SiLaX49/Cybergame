/** Passage à citer après l’intitulé d’un indice, sauf s’il y est déjà écrit (« On me presse : « sous 24 h » »). */
export function citationUtile(indice: { libelle: string; passage?: string }): string | undefined {
  return indice.passage && !indice.libelle.includes(indice.passage) ? indice.passage : undefined
}
