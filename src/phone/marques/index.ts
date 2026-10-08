import type { Component, FunctionalComponent } from 'vue'
import { APPLIS, type Appli } from '../applis'
import type { EcranTelephone } from '../types'
import CoqueChatCord from './CoqueChatCord.vue'
import CoqueGameBox from './CoqueGameBox.vue'
import CoqueMessages from './CoqueMessages.vue'
import CoqueRevendo from './CoqueRevendo.vue'
import CoqueSnapTalk from './CoqueSnapTalk.vue'

/** Coques des applis de conversation ; les autres marques gardent l’en-tête simple. */
const COQUES: Partial<Record<Appli['marque'], Component>> = {
  snaptalk: CoqueSnapTalk,
  chatcord: CoqueChatCord,
  messages: CoqueMessages,
  gamebox: CoqueGameBox,
  revendo: CoqueRevendo,
}

/**
 * Coque d’un écran de conversation (sms, chat) : le composant, sa marque, et les attributs posés sur sa racine
 * (`data-marque`, accent et texte sur l’accent tirés du registre). `null` pour les autres écrans.
 */
export function coque(ecran: EcranTelephone) {
  if (ecran.app !== 'sms' && ecran.app !== 'chat') return null
  const a = APPLIS[ecran.appNom]
  const composant = a && COQUES[a.marque]
  if (!composant) return null
  const style = { '--marque-accent': a.accent, '--marque-texte': a.texteSurAccent }
  return { composant, marque: a.marque, attrs: { ecran, 'data-marque': a.marque, style } }
}

/** Sans coque : rend seulement son contenu. */
export const SansCoque: FunctionalComponent = (_props, { slots }) => slots.default?.()
