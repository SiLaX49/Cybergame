<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { Choix } from '@/content/schema'
import type { Mode } from '@/store/progress'
import ConversationApp from './apps/ConversationApp.vue'
import MailApp from './apps/MailApp.vue'
import SocialApp from './apps/SocialApp.vue'
import WebApp from './apps/WebApp.vue'
import { gesteDuChoix } from './gestes'
import ActionsApp from './parts/ActionsApp.vue'
import BanniereSysteme from './parts/BanniereSysteme.vue'
import BarreEtat from './parts/BarreEtat.vue'
import Bulle from './parts/Bulle.vue'
import EnteteApp from './parts/EnteteApp.vue'
import type { EcranTelephone } from './types'
import './theme.css'

const props = withDefaults(
  defineProps<{ ecran: EcranTelephone; choix?: Choix[]; mode?: Mode; graine?: string; choixJoue?: string | null }>(),
  { choix: undefined, mode: 'solo', graine: '', choixJoue: null },
)
const emit = defineEmits<{ choisir: [choixId: string] }>()

const nomApp = computed(() => (props.ecran.app === 'verrouillage' ? 'écran verrouillé' : props.ecran.appNom))
const heure = computed(() => {
  const heures = props.ecran.app === 'verrouillage' ? props.ecran.notifications.map((n) => n.heure) : props.ecran.messages.map((m) => m.heure)
  return heures.filter(Boolean).at(-1) ?? '14:32'
})
/** En-tête : la conversation porte le nom du contact ; le web a sa barre d'adresse ; l'écran verrouillé n'en a pas. */
const entete = computed(() => {
  const e = props.ecran
  if (e.app === 'sms' || e.app === 'chat') return { titre: e.contact, sousTitre: e.appNom, avatar: true }
  if (e.app === 'social' || e.app === 'mail') return { titre: e.appNom, avatar: false }
  return null
})

const joue = computed(() => (props.choixJoue ? (props.choix?.find((c) => c.id === props.choixJoue) ?? null) : null))
const zone = ref<HTMLElement | null>(null)
// Le choix joué apparaît en bas de l'écran : on y fait défiler la zone.
watch(joue, async (c) => {
  if (!c) return
  await nextTick()
  if (zone.value) zone.value.scrollTop = zone.value.scrollHeight
})
</script>

<template>
  <figure class="telephone" :data-app="ecran.app" :aria-label="`Écran de téléphone : ${nomApp}`">
    <BarreEtat :heure="heure" />
    <EnteteApp v-if="entete" v-bind="entete" />
    <!-- Zone défilante (grands textes, mode classe) : focusable pour défiler au clavier. -->
    <div ref="zone" class="ecran" tabindex="0" role="region" :aria-label="`Contenu de l’écran : ${nomApp}`">
      <ConversationApp v-if="ecran.app === 'sms' || ecran.app === 'chat'" :ecran="ecran" />
      <SocialApp v-else-if="ecran.app === 'social'" :ecran="ecran" />
      <MailApp v-else-if="ecran.app === 'mail'" :ecran="ecran" />
      <WebApp v-else-if="ecran.app === 'web'" :ecran="ecran" />
      <div class="choix-joue" role="status">
        <template v-if="joue">
          <Bulle
            v-if="gesteDuChoix(joue) === 'repondre' && joue.reponse"
            :message="{ de: 'moi', texte: joue.reponse, texteSimple: joue.reponseSimple }"
            nom=""
          />
          <BanniereSysteme v-else :geste="gesteDuChoix(joue)" />
        </template>
      </div>
    </div>
    <ActionsApp v-if="choix && !choixJoue" :choix="choix" :graine="graine" :mode="mode" @choisir="(id) => emit('choisir', id)" />
  </figure>
</template>

<style scoped>
.telephone {
  margin: 0; width: var(--tel-largeur); max-width: 100%; height: var(--tel-hauteur); display: flex; flex-direction: column;
  border: 10px solid var(--tel-coque); border-radius: 32px; overflow: hidden;
  background: var(--tel-fond); color: var(--tel-texte);
}
@media (max-width: 48rem) { .telephone { width: 100%; height: min(40rem, 80vh); } }
.ecran { flex: 1; min-height: 0; padding: 0.75rem; overflow-y: auto; background: var(--tel-fond); }
.choix-joue { display: flex; flex-direction: column; }
</style>
