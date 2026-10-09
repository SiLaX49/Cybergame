<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Choix, FilAction } from '@/content/schema'
import { useProgress } from '@/store/useProgress'
import AccueilApp from './apps/AccueilApp.vue'
import ConversationApp from './apps/ConversationApp.vue'
import MailApp from './apps/MailApp.vue'
import SocialApp from './apps/SocialApp.vue'
import VerrouillageApp from './apps/VerrouillageApp.vue'
import WebApp from './apps/WebApp.vue'
import BarreEtat from './parts/BarreEtat.vue'
import BarreGeste from './parts/BarreGeste.vue'
import EnteteApp from './parts/EnteteApp.vue'
import RetourChoix from './parts/RetourChoix.vue'
import Verdict from './parts/Verdict.vue'
import { coque, SansCoque } from './marques'
import { atteinte } from './sequence'
import type { EcranTelephone } from './types'
import { useDefilement } from './useDefilement'
import { useEntree, type EtatTelephone } from './useEntree'
import { usePassages } from './usePassages'
import { useSequence } from './useSequence'
import './theme.css'

const props = withDefaults(
  defineProps<{
    ecran: EcranTelephone
    choix?: Choix[]
    choixJoue?: string | null
    actionsNotif?: Record<string, FilAction>
    /** Indices, dans l'ordre : leur rang donne le numéro du surlignage. */
    indices?: { libelle: string; passage?: string }[]
    /** Indice joué (bouton de la barre de mission) : passages surlignés sans numéros avant le choix. */
    indiceVisible?: boolean
    /** Entrée par notification : démarre sur l'écran verrouillé, avec un écran d'accueil (scénarios). */
    entree?: boolean
  }>(),
  { choix: undefined, choixJoue: null, actionsNotif: () => ({}), indices: () => [], indiceVisible: false, entree: false },
)
const emit = defineEmits<{
  agir: [notificationId: string, action: FilAction]
  'sequence-finie': []
  /** État de l’écran (verrouillé, accueil, appli), émis au départ puis à chaque changement. */
  etat: [etat: EtatTelephone]
}>()
const store = useProgress()

const zone = ref<HTMLElement | null>(null)
const { etat, zoom, notification, dataApp, nomApp, aller } = useEntree(props, zone)
watch(etat, (e) => emit('etat', e), { immediate: true })
const heure = computed(() => {
  const heures = props.ecran.app === 'verrouillage' ? props.ecran.notifications.map((n) => n.heure) : props.ecran.messages.map((m) => m.heure)
  return heures.filter(Boolean).at(-1) ?? '14:32'
})
/** En-tête : la conversation porte le nom du contact ; le web a sa barre d'adresse ; l'écran verrouillé n'en a pas. */
const entete = computed(() => {
  const e = props.ecran
  if (e.app === 'sms' || e.app === 'chat') return { titre: e.contact, sousTitre: e.appNom, avatar: true, riche: true }
  if (e.app === 'social' || e.app === 'mail') return { titre: e.appNom, avatar: false }
  return null
})
/** Coque de la marque (conversations) : seulement l’appli ouverte, jamais l’écran verrouillé ni l’accueil. */
const habillage = computed(() => (etat.value === 'appli' ? coque(props.ecran) : null))

const joue = computed(() => (props.choixJoue ? (props.choix?.find((c) => c.id === props.choixJoue) ?? null) : null))
const contact = computed(() => ('contact' in props.ecran ? props.ecran.contact : ''))
const instantane = () => !store.etat.reglages.animations
const { etape } = useSequence(
  () => props.choixJoue,
  () => ({ reaction: Boolean(joue.value?.reaction), instantane: instantane() }),
)
const verdict = computed(() => (joue.value && atteinte(etape.value, 'verdict') ? (joue.value.qualite === 'risque' ? 'piege' : 'bon') : null))

usePassages(props, etape)
useDefilement(zone, etape, instantane)
watch(
  etape,
  (e) => {
    if (e === 'fin') emit('sequence-finie')
  },
  { immediate: true },
)
</script>

<template>
  <figure
    class="telephone"
    :class="verdict === 'piege' ? 'secousse' : verdict ? 'rebond' : undefined"
    :data-app="dataApp"
    :data-verdict="verdict ?? undefined"
    :aria-label="`Écran de téléphone : ${nomApp}`"
  >
    <BarreEtat :heure="heure" />
    <EnteteApp v-if="entete && etat === 'appli' && !habillage" v-bind="entete" />
    <component :is="habillage?.composant ?? SansCoque" v-bind="habillage?.attrs">
      <!-- Zone défilante (grands textes, mode classe) : focusable pour défiler au clavier. -->
      <div ref="zone" class="ecran" :class="{ zoom }" tabindex="0" role="region" :aria-label="`Contenu de l’écran : ${nomApp}`">
        <VerrouillageApp v-if="etat === 'verrouille' && notification" :entree="notification" :heure="heure" @ouvrir="aller('appli')" />
        <AccueilApp v-else-if="etat === 'accueil' && notification" :app-nom="notification.appNom" @ouvrir="aller('appli')" />
        <ConversationApp v-else-if="ecran.app === 'sms' || ecran.app === 'chat'" :ecran="ecran" :lu="habillage?.marque === 'messages'" />
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
          <RetourChoix v-if="joue" :choix="joue" :etape="etape" :contact="contact" />
        </div>
        <!-- Verdict collé en bas de la zone défilante : visible même quand on remonte vers les passages surlignés. -->
        <div class="verdict-colle" role="status"><Verdict v-if="verdict" :verdict="verdict" /></div>
      </div>
    </component>
    <BarreGeste v-if="entree && etat === 'appli' && notification && !choixJoue" @accueil="aller('accueil')" />
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
/* Anneau intérieur : la coque (overflow: hidden) rognerait un anneau extérieur. */
.ecran:focus-visible { outline: 3px solid var(--focus); outline-offset: -3px; box-shadow: inset 0 0 0 6px var(--focus-lisere); }
.choix-joue { display: flex; flex-direction: column; gap: 0.5rem; }
.verdict-colle { position: sticky; bottom: 0; }
/* Verdict : halo en fondu de 200 ms puis fixe ; secousse ou rebond seulement sans préférence de mouvement réduit. */
.telephone { transition: box-shadow 200ms ease-out; }
.telephone[data-verdict='piege'] { box-shadow: 0 0 0 4px var(--tel-halo-piege), 0 0 24px 6px var(--tel-halo-piege); }
.telephone[data-verdict='bon'] { box-shadow: 0 0 0 4px var(--tel-halo-bon), 0 0 24px 6px var(--tel-halo-bon); }
@media (prefers-reduced-motion: no-preference) {
  .secousse { animation: secousse 350ms ease-out; }
  .rebond { animation: rebond 250ms ease-out; }
  .zoom { animation: zoom 200ms ease-out; }
}
@keyframes secousse { 15% { transform: translateX(-8px); } 30% { transform: translateX(8px); } 50% { transform: translateX(-5px); } 65% { transform: translateX(5px); } 80% { transform: translateX(-2px); } 90% { transform: translateX(2px); } }
@keyframes rebond { 50% { transform: scale(1.03); } }
@keyframes zoom { from { transform: scale(0.9); } }
</style>
