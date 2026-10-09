import type { Component, FunctionalComponent } from 'vue'
import type { Appli } from '../applis'
import { marqueAffichee } from '../habillage'
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
/** Applis à en-tête seul : même coque quel que soit le type d’écran (contact d’une conversation en sous-titre). */
const AUTRES: Coques = { banquenova: CoqueBanqueNova, ent: CoqueEnt, meteo: CoqueMeteo }
const CONVERSATION: Coques = { snaptalk: CoqueSnapTalk, chatcord: CoqueChatCord, messages: CoqueMessages, gamebox: CoqueGameBox, revendo: CoqueRevendo, ...AUTRES }

/** Coque de chaque marque habillée (`marqueAffichee`), par type d’écran. */
const COQUES: Record<Exclude<EcranTelephone['app'], 'verrouillage'>, Coques> = {
  sms: CONVERSATION,
  chat: CONVERSATION,
  social: { snaptalk: CoqueSnapTalkPublication, streamtube: CoqueStreamTube, ...AUTRES },
  mail: { mail: CoqueMail, ...AUTRES },
  web: { navigateur: CoqueNavigateur, magasin: CoqueMagasin },
}

/**
 * Coque d’un écran d’appli : le composant, sa marque, et les attributs posés sur sa racine (`data-marque`, accent
 * et texte sur l’accent tirés du registre). `null` pour l’écran verrouillé et les marques sans coque.
 */
export function coque(ecran: EcranTelephone) {
  const a = marqueAffichee(ecran)
  const composant = a && ecran.app !== 'verrouillage' ? COQUES[ecran.app][a.marque] : undefined
  if (!a || !composant) return null
  const style = { '--marque-accent': a.accent, '--marque-texte': a.texteSurAccent }
  return { composant, marque: a.marque, attrs: { ecran, 'data-marque': a.marque, style } }
}

/** Sans coque : rend seulement son contenu. */
export const SansCoque: FunctionalComponent = (_props, { slots }) => slots.default?.()
