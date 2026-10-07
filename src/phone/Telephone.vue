<script setup lang="ts">
import { computed, nextTick, provide, ref, watch } from 'vue'
import type { Choix, FilAction } from '@/content/schema'
import type { Mode } from '@/store/progress'
import { useProgress } from '@/store/useProgress'
import ConversationApp from './apps/ConversationApp.vue'
import MailApp from './apps/MailApp.vue'
import SocialApp from './apps/SocialApp.vue'
import VerrouillageApp from './apps/VerrouillageApp.vue'
import WebApp from './apps/WebApp.vue'
import ActionsApp from './parts/ActionsApp.vue'
import BarreEtat from './parts/BarreEtat.vue'
import BoutonIndice from './parts/BoutonIndice.vue'
import EnteteApp from './parts/EnteteApp.vue'
import RetourChoix from './parts/RetourChoix.vue'
import { atteinte } from './sequence'
import { CLE_PASSAGES } from './surlignage'
import type { EcranTelephone } from './types'
import { useSequence } from './useSequence'
import './theme.css'

const props = withDefaults(
  defineProps<{
    ecran: EcranTelephone
    choix?: Choix[]
    mode?: Mode
    graine?: string
    choixJoue?: string | null
    actionsNotif?: Record<string, FilAction>
    /** Indices, dans l'ordre : leur rang donne le numéro du surlignage. */
    indices?: { libelle: string; passage?: string }[]
    /** Bouton « Indice » joué : passages surlignés sans numéros avant le choix. */
    indiceVisible?: boolean
  }>(),
  { choix: undefined, mode: 'solo', graine: '', choixJoue: null, actionsNotif: () => ({}), indices: () => [], indiceVisible: false },
)
const emit = defineEmits<{
  choisir: [choixId: string]
  agir: [notificationId: string, action: FilAction]
  'sequence-finie': []
  indice: []
}>()
const store = useProgress()

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
const contact = computed(() => ('contact' in props.ecran ? props.ecran.contact : ''))
const { etape } = useSequence(
  () => props.choixJoue,
  () => ({ reaction: Boolean(joue.value?.reaction), instantane: !store.etat.reglages.animations }),
)
const verdict = computed(() => (joue.value && atteinte(etape.value, 'verdict') ? (joue.value.qualite === 'risque' ? 'piege' : 'bon') : null))

// Surlignage : numéroté dès l'étape `indices`, sans numéros avant le choix si l'indice est demandé.
const avecPassage = computed(() => props.indices.flatMap((i, rang) => (i.passage ? [{ texte: i.passage, rang: rang + 1 }] : [])))
const passages = computed(() => {
  if (atteinte(etape.value, 'indices')) return avecPassage.value.map((p) => ({ texte: p.texte, numero: p.rang }))
  return props.indiceVisible ? avecPassage.value.map((p) => ({ texte: p.texte, numero: null })) : []
})
provide(CLE_PASSAGES, passages)
const boutonIndice = computed(() => Boolean(props.choix) && !props.choixJoue && avecPassage.value.length > 0)

const zone = ref<HTMLElement | null>(null)
// Le retour du choix apparaît en bas de l'écran : on y fait défiler la zone, jusqu'au verdict.
watch(
  etape,
  async (e) => {
    if (e === 'fin') emit('sequence-finie')
    if (e === 'attente' || atteinte(e, 'indices')) return
    await nextTick()
    if (zone.value) zone.value.scrollTop = zone.value.scrollHeight
  },
  { immediate: true },
)
</script>

<template>
  <figure
    class="telephone"
    :class="verdict === 'piege' ? 'secousse' : verdict ? 'rebond' : undefined"
    :data-app="ecran.app"
    :data-verdict="verdict ?? undefined"
    :aria-label="`Écran de téléphone : ${nomApp}`"
  >
    <BarreEtat :heure="heure" />
    <EnteteApp v-if="entete" v-bind="entete" />
    <!-- Zone défilante (grands textes, mode classe) : focusable pour défiler au clavier. -->
    <div ref="zone" class="ecran" tabindex="0" role="region" :aria-label="`Contenu de l’écran : ${nomApp}`">
      <ConversationApp v-if="ecran.app === 'sms' || ecran.app === 'chat'" :ecran="ecran" />
      <SocialApp v-else-if="ecran.app === 'social'" :ecran="ecran" />
      <MailApp v-else-if="ecran.app === 'mail'" :ecran="ecran" />
      <WebApp v-else-if="ecran.app === 'web'" :ecran="ecran" />
      <VerrouillageApp
        v-else-if="ecran.app === 'verrouillage'"
        :notifications="ecran.notifications"
        :actions="actionsNotif"
        :heure="heure"
        @agir="(id, a) => emit('agir', id, a)"
      />
      <div class="choix-joue" role="status">
        <RetourChoix v-if="joue" :choix="joue" :etape="etape" :contact="contact" :verdict="verdict" />
      </div>
    </div>
    <ActionsApp v-if="choix && !choixJoue" :choix="choix" :graine="graine" :mode="mode" @choisir="(id) => emit('choisir', id)">
      <BoutonIndice v-if="boutonIndice" :actif="indiceVisible" @indice="emit('indice')" />
    </ActionsApp>
  </figure>
</template>

<style scoped>
.telephone {
  margin: 0; width: var(--tel-largeur); max-width: 100%; height: var(--tel-hauteur); display: flex; flex-direction: column;
  border: 12px solid var(--tel-coque); border-radius: 22px; overflow: hidden;
  background: var(--tel-fond); color: var(--tel-texte);
  /* Reste entier à l’écran quand la page défile (bureau) ; statique en mode scène (MissionPage). */
  position: var(--tel-position, sticky); top: 1rem;
}
@media (max-width: 48em) { .telephone { position: static; } }
.ecran { flex: 1; min-height: 0; padding: 0.75rem; overflow-y: auto; scrollbar-width: thin; background: var(--tel-fond); }
.choix-joue { display: flex; flex-direction: column; gap: 0.5rem; }
/* Verdict : halo en fondu de 200 ms puis fixe ; secousse ou rebond seulement sans préférence de mouvement réduit. */
.telephone { transition: box-shadow 200ms ease-out; }
.telephone[data-verdict='piege'] { box-shadow: 0 0 0 4px var(--tel-halo-piege), 0 0 24px 6px var(--tel-halo-piege); }
.telephone[data-verdict='bon'] { box-shadow: 0 0 0 4px var(--tel-halo-bon), 0 0 24px 6px var(--tel-halo-bon); }
@media (prefers-reduced-motion: no-preference) {
  .secousse { animation: secousse 350ms ease-out; }
  .rebond { animation: rebond 250ms ease-out; }
}
@keyframes secousse { 15% { transform: translateX(-8px); } 30% { transform: translateX(8px); } 50% { transform: translateX(-5px); } 65% { transform: translateX(5px); } 80% { transform: translateX(-2px); } 90% { transform: translateX(2px); } }
@keyframes rebond { 50% { transform: scale(1.03); } }
</style>
