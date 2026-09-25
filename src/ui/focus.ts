import { nextTick, onMounted, watch, type Ref, type WatchSource } from 'vue'

type Cible = Ref<HTMLElement | null>

async function focaliser(cible: Cible) {
  await nextTick()
  cible.value?.focus()
}

/** Donne le focus à `cible` dès l'affichage du composant (changement d'étape d'une mission). */
export function focusAuMontage(cible: Cible): void {
  onMounted(() => focaliser(cible))
}

/** Donne le focus à `cible` chaque fois que `source` change (le contrôle cliqué vient de disparaître). */
export function focusAuChangement(source: WatchSource, cible: Cible): void {
  watch(source, () => focaliser(cible))
}
