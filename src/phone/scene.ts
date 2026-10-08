import type { Choix, FilAction } from '@/content/schema'
import type { Mode } from '@/store/progress'
import type { EcranTelephone } from './types'

/** Données d’une scène : ce que la page passe à `SceneTelephone` (téléphone à gauche, choix et panneau à droite). */
export interface Scene {
  ecran: EcranTelephone
  choix?: Choix[]
  mode?: Mode
  graine?: string
  choixJoue?: string | null
  /** Indices, dans l’ordre : leur rang donne le numéro du surlignage. */
  indices?: { libelle: string; passage?: string }[]
  /** Indice joué : passages surlignés sans numéros avant le choix. */
  indiceVisible?: boolean
  /** Entrée par notification (scénarios). */
  entree?: boolean
  actionsNotif?: Record<string, FilAction>
}
