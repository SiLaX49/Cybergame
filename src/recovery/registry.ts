import type { Component } from 'vue'
import type { RecoveryAction } from '@/content/schema'
import Activer2fa from './Activer2fa.vue'
import BloquerSignaler from './BloquerSignaler.vue'
import CapturePreuve from './CapturePreuve.vue'
import ChangerMdp from './ChangerMdp.vue'
import DemanderAide from './DemanderAide.vue'
import CorrigerPartage from './CorrigerPartage.vue'
import PrevenirContacts from './PrevenirContacts.vue'

export const RECUPERATIONS: Record<RecoveryAction, Component> = {
  'bloquer-signaler': BloquerSignaler,
  'changer-mdp': ChangerMdp,
  'activer-2fa': Activer2fa,
  'capture-preuve': CapturePreuve,
  'prevenir-contacts': PrevenirContacts,
  'corriger-partage': CorrigerPartage,
  'demander-aide': DemanderAide,
}
