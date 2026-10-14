import { onScopeDispose, readonly, ref, watch } from 'vue'
import { planSequence, type EtapeSequence } from './sequence'

/**
 * Joue la séquence de retour avec des minuteries : chaque nouvelle valeur non nulle du déclencheur la relance,
 * `null` la remet en attente. Minuteries annulées à chaque changement et au démontage.
 */
export function useSequence(declencheur: () => string | null, options: () => { reaction: boolean; instantane: boolean }) {
  const etape = ref<EtapeSequence>('attente')
  let minuteries: ReturnType<typeof setTimeout>[] = []
  const annuler = () => {
    minuteries.forEach(clearTimeout)
    minuteries = []
  }

  watch(
    declencheur,
    (valeur) => {
      annuler()
      etape.value = 'attente'
      if (valeur === null) return
      for (const pas of planSequence(options())) {
        if (pas.a === 0) etape.value = pas.etape
        else minuteries.push(setTimeout(() => (etape.value = pas.etape), pas.a))
      }
    },
    { immediate: true },
  )
  onScopeDispose(annuler)

  return { etape: readonly(etape) }
}
