import { reactive, readonly, ref, watch } from 'vue'
import type { Tranche } from '@/content/schema'
import type { SurpriseResultat } from '@/engine/mission-runner'
import { GAINS } from '@/engine/octets'
import { dateDuJour, solde } from '@/engine/portefeuille'
import { objetBoutique } from '@/profil/boutique'
import {
  chargerProgression,
  effacerProgression,
  progressionVide,
  sauverProgression,
  stockageSur,
  type Mode,
  type PersonnageId,
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

  function noterJournee(maintenant: Date, ajout: { missions: number; octets: number; reparations: number }) {
    const date = dateDuJour(maintenant)
    const j = etat.journal?.date === date ? etat.journal : { date, missions: 0, octets: 0, reparations: 0 }
    etat.journal = {
      date,
      missions: j.missions + ajout.missions,
      octets: j.octets + ajout.octets,
      reparations: j.reparations + ajout.reparations,
    }
  }

  return {
    etat: readonly(etat),
    persistant: readonly(persistant),
    choisirTranche(tranche: Tranche) {
      etat.tranche = tranche
    },
    choisirPersonnage(id: PersonnageId) {
      etat.personnage = id
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
    /**
     * Crédite une mission terminée : seule l’amélioration du meilleur gain est versée (rejouer à l’identique
     * ne rapporte rien, faire mieux rapporte la différence). Renvoie les octets réellement crédités.
     */
    crediterMission(id: string, gain: number, erreurReparee: boolean, maintenant = new Date()): number {
      const credit = Math.max(0, gain - (etat.octets[id] ?? 0))
      if (credit > 0) etat.octets[id] = gain
      noterJournee(maintenant, { missions: 1, octets: credit, reparations: erreurReparee ? 1 : 0 })
      return credit
    },
    /** Défi du jour relevé : une seule fois par jour. Renvoie vrai si le bonus vient d’être gagné. */
    releverDefi(maintenant = new Date()): boolean {
      const date = dateDuJour(maintenant)
      if (etat.defis.includes(date)) return false
      etat.defis.push(date)
      noterJournee(maintenant, { missions: 0, octets: GAINS.defiDuJour, reparations: 0 })
      return true
    },
    /** Achète un objet de la boutique s’il reste assez d’octets ; un titre acheté est aussitôt porté. */
    acheter(id: string): boolean {
      const objet = objetBoutique(id)
      if (!objet || etat.achats.includes(id) || solde(etat) < objet.prix) return false
      etat.achats.push(id)
      if (objet.type === 'titre') etat.titre = id
      return true
    },
    porterTitre(id: string | null) {
      if (id === null || etat.achats.includes(id)) etat.titre = id
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
