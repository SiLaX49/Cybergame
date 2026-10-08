import { nextTick, watch, type Ref } from 'vue'
import { atteinte, type EtapeSequence } from './sequence'

/**
 * Défilement de la zone pendant la séquence : vers le bas jusqu’au verdict (le retour du choix y apparaît), puis, une
 * fois les indices atteints, jusqu’au premier passage numéroté s’il est hors de vue. Le verdict, collé en bas de la
 * zone, reste visible. Sans défilement doux en mode instantané ni avec une préférence de mouvement réduit.
 */
export function useDefilement(zone: Ref<HTMLElement | null>, etape: Readonly<Ref<EtapeSequence>>, instantane: () => boolean) {
  watch(
    etape,
    async (e, avant) => {
      if (e === 'attente') return
      await nextTick()
      const z = zone.value
      if (!z) return
      if (!atteinte(e, 'indices')) z.scrollTop = z.scrollHeight
      // Une seule fois : à l’étape `indices`, ou à `fin` directement en mode instantané.
      else if (!avant || !atteinte(avant, 'indices')) montrerPassage(z, instantane())
    },
    { immediate: true },
  )
}

/** Amène le premier passage numéroté en haut de la zone (petite marge au-dessus) s’il n’y est pas entièrement visible. */
function montrerPassage(z: HTMLElement, instantane: boolean) {
  const passage = z.querySelector('mark.numerote')
  if (!passage) return
  const p = passage.getBoundingClientRect()
  const cadre = z.getBoundingClientRect()
  if (p.top >= cadre.top && p.bottom <= cadre.bottom) return
  const doux = !instantane && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  z.scrollTo({ top: z.scrollTop + p.top - cadre.top - 8, behavior: doux ? 'smooth' : 'auto' })
}
