<script setup lang="ts">
import { computed } from 'vue'
import ConversationApp from './apps/ConversationApp.vue'
import BarreEtat from './parts/BarreEtat.vue'
import EnteteApp from './parts/EnteteApp.vue'
import type { EcranTelephone } from './types'
import './theme.css'

const props = defineProps<{ ecran: EcranTelephone }>()

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
</script>

<template>
  <figure class="telephone" :data-app="ecran.app" :aria-label="`Écran de téléphone : ${nomApp}`">
    <BarreEtat :heure="heure" />
    <EnteteApp v-if="entete" v-bind="entete" />
    <!-- Zone défilante (grands textes, mode classe) : focusable pour défiler au clavier. -->
    <div class="ecran" tabindex="0" role="region" :aria-label="`Contenu de l’écran : ${nomApp}`">
      <ConversationApp v-if="ecran.app === 'sms' || ecran.app === 'chat'" :ecran="ecran" />
    </div>
  </figure>
</template>

<style scoped>
.telephone {
  margin: 0; width: min(100%, 24rem); display: flex; flex-direction: column;
  border: 10px solid var(--tel-coque); border-radius: 32px; overflow: hidden;
  background: var(--tel-fond); color: var(--tel-texte);
}
:root[data-taille='tres-grand'] .telephone { width: min(100%, 28rem); }
.ecran { padding: 0.75rem; max-height: 28em; overflow-y: auto; background: var(--tel-fond); }
</style>
