import type { Component } from 'vue'
import type { RecoveryAction } from '@/content/schema'
import Activer2fa from './Activer2fa.vue'
import BloquerSignaler from './BloquerSignaler.vue'
import CapturePreuve from './CapturePreuve.vue'
import ChangerMdp from './ChangerMdp.vue'
import DemanderAide from './DemanderAide.vue'
import CorrigerPartage from './CorrigerPartage.vue'
import PrevenirContacts from './PrevenirContacts.vue'
import RetirerPublication from './RetirerPublication.vue'
import Soutenir from './Soutenir.vue'
import type { ContexteSensible } from './textes'

export const RECUPERATIONS: Record<RecoveryAction, Component> = {
  'bloquer-signaler': BloquerSignaler,
  'changer-mdp': ChangerMdp,
  'activer-2fa': Activer2fa,
  'capture-preuve': CapturePreuve,
  'prevenir-contacts': PrevenirContacts,
  'corriger-partage': CorrigerPartage,
  soutenir: Soutenir,
  'retirer-publication': RetirerPublication,
  'demander-aide': DemanderAide,
}

/** Props propres à une action : le contexte du thème sensible, pour les actions dont le texte en dépend. */
export function propsRecuperation(action: RecoveryAction, contexte: ContexteSensible | undefined): { contexte?: ContexteSensible } {
  return contexte && (action === 'soutenir' || action === 'bloquer-signaler') ? { contexte } : {}
}
