import type { Ecran, Fil } from '@/content/schema'

/** Ce que le téléphone sait afficher : l'écran d'un scénario ou l'écran verrouillé d'un fil. */
export type EcranTelephone = Ecran | { app: 'verrouillage'; notifications: Fil['notifications'] }
