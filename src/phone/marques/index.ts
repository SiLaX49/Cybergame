import type { Component, FunctionalComponent } from 'vue'
import { APPLIS, type Appli } from '../applis'
import type { EcranTelephone } from '../types'
import CoqueBanqueNova from './CoqueBanqueNova.vue'
import CoqueChatCord from './CoqueChatCord.vue'
import CoqueEnt from './CoqueEnt.vue'
import CoqueGameBox from './CoqueGameBox.vue'
import CoqueMagasin from './CoqueMagasin.vue'
import CoqueMail from './CoqueMail.vue'
import CoqueMessages from './CoqueMessages.vue'
import CoqueMeteo from './CoqueMeteo.vue'
import CoqueNavigateur from './CoqueNavigateur.vue'
import CoqueRevendo from './CoqueRevendo.vue'
import CoqueSnapTalk from './CoqueSnapTalk.vue'
import CoqueSnapTalkPublication from './CoqueSnapTalkPublication.vue'
import CoqueStreamTube from './CoqueStreamTube.vue'

type Coques = Partial<Record<Appli['marque'], Component>>
/** Applis à en-tête seul : même coque quel que soit le type d’écran. */
const AUTRES: Coques = { banquenova: CoqueBanqueNova, ent: CoqueEnt, meteo: CoqueMeteo }
const CONVERSATION: Coques = { snaptalk: CoqueSnapTalk, chatcord: CoqueChatCord, messages: CoqueMessages, gamebox: CoqueGameBox, revendo: CoqueRevendo, ...AUTRES }

/**
 * Coques par type d’écran, puis par marque. `sinon` : appli qui affiche l’écran d’une marque sans coque. Toute page web
 * s’ouvre dans le navigateur (une page de hameçonnage n’est jamais habillée en appli officielle), sauf les fiches du
 * magasin d’applis du système.
 */
const COQUES: Record<Exclude<EcranTelephone['app'], 'verrouillage'>, { marques: Coques; sinon?: string }> = {
  sms: { marques: CONVERSATION },
  chat: { marques: CONVERSATION },
  social: { marques: { snaptalk: CoqueSnapTalkPublication, streamtube: CoqueStreamTube, ...AUTRES } },
  mail: { marques: { mail: CoqueMail, ...AUTRES } },
  web: { marques: { navigateur: CoqueNavigateur, magasin: CoqueMagasin }, sinon: 'Navigateur' },
}

/**
 * Coque d’un écran d’appli : le composant, sa marque, et les attributs posés sur sa racine (`data-marque`, accent
 * et texte sur l’accent tirés du registre). `null` pour l’écran verrouillé et les marques sans coque.
 */
export function coque(ecran: EcranTelephone) {
  if (ecran.app === 'verrouillage') return null
  const { marques, sinon } = COQUES[ecran.app]
  const propre = APPLIS[ecran.appNom]
  const a = propre && marques[propre.marque] ? propre : sinon ? APPLIS[sinon] : undefined
  const composant = a && marques[a.marque]
  if (!composant) return null
  const style = { '--marque-accent': a.accent, '--marque-texte': a.texteSurAccent }
  return { composant, marque: a.marque, attrs: { ecran, 'data-marque': a.marque, style } }
}

/** Sans coque : rend seulement son contenu. */
export const SansCoque: FunctionalComponent = (_props, { slots }) => slots.default?.()
