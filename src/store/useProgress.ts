import { reactive, readonly, ref, watch } from 'vue'
import type { Tranche } from '@/content/schema'
import type { SurpriseResultat } from '@/engine/mission-runner'
import {
  chargerProgression,
  effacerProgression,
  progressionVide,
  sauverProgression,
  stockageSur,
  type Mode,
  type Progress,
  type Reglages,
} from './progress'

export function creerStore(storage: Storage | null) {
  const etat = reactive(chargerProgression(storage)) as Progress
  const persistant = ref(storage !== null)

  watch(
    etat,
    () => {
      if (!sauverProgression(storage, etat)) persistant.value = false
    },
    { deep: true, flush: 'sync' },
  )

  return {
    etat: readonly(etat),
    persistant: readonly(persistant),
    choisirTranche(tranche: Tranche) {
      etat.tranche = tranche
    },
    choisirMode(mode: Mode) {
      etat.mode = mode
    },
    modifierReglages(reglages: Partial<Reglages>) {
      Object.assign(etat.reglages, reglages)
    },
    enregistrerMission(id: string, badges: string[], choix: Record<string, string>, maintenant = new Date()) {
      // Une mission rejouée garde sa première date (point de départ des rappels) et tous ses badges.
      const avant = etat.missions[id]
      etat.missions[id] = {
        termineeLe: avant?.termineeLe ?? maintenant.toISOString(),
        badges: [...new Set([...(avant?.badges ?? []), ...badges])],
        choix,
      }
    },
    enregistrerRappel(id: string, resultatSurprise: SurpriseResultat | null, maintenant = new Date()) {
      const fois = (etat.rappels[id]?.fois ?? 0) + 1
      etat.rappels[id] = { faitLe: maintenant.toISOString(), fois, resultatSurprise }
    },
    effacer() {
      Object.assign(etat, progressionVide())
      effacerProgression(storage)
    },
  }
}

export type ProgressStore = ReturnType<typeof creerStore>

let instance: ProgressStore | null = null

export function useProgress(): ProgressStore {
  instance ??= creerStore(stockageSur())
  return instance
}

/** Réservé aux tests : remplace le store global. */
export function definirStore(store: ProgressStore): void {
  instance = store
}
