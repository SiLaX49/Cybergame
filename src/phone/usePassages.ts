import { computed, provide, type Ref } from 'vue'
import { atteinte, type EtapeSequence } from './sequence'
import { CLE_PASSAGES } from './surlignage'

/**
 * Surlignage fourni aux applis : numéroté dès l'étape `indices`, sans numéros avant le choix si l'indice est demandé.
 * `boutonIndice` : le bouton « Indice » n'a de sens qu'avant le choix et s'il y a des passages.
 */
export function usePassages(
  props: { indices: { libelle: string; passage?: string }[]; indiceVisible: boolean; choix?: unknown[]; choixJoue: string | null },
  etape: Readonly<Ref<EtapeSequence>>,
) {
  const avecPassage = computed(() => props.indices.flatMap((i, rang) => (i.passage ? [{ texte: i.passage, rang: rang + 1 }] : [])))
  const passages = computed(() => {
    if (atteinte(etape.value, 'indices')) return avecPassage.value.map((p) => ({ texte: p.texte, numero: p.rang }))
    return props.indiceVisible ? avecPassage.value.map((p) => ({ texte: p.texte, numero: null })) : []
  })
  provide(CLE_PASSAGES, passages)
  return { boutonIndice: computed(() => Boolean(props.choix) && !props.choixJoue && avecPassage.value.length > 0) }
}
