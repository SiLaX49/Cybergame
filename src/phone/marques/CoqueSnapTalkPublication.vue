<script setup lang="ts">
import { Camera, Clapperboard, MapPin, MessageSquare, Users } from '@lucide/vue'
import type { Ecran } from '@/content/schema'
import EnteteApp from '../parts/EnteteApp.vue'
import BarreOnglets from './BarreOnglets.vue'

/** SnapTalk (publication) : bandeau sur l’accent, anneau de story autour du compte, onglet Spotlight actif. */
defineProps<{ ecran: Ecran }>()
const ONGLETS = [
  { nom: 'Carte', icone: MapPin },
  { nom: 'Chat', icone: MessageSquare },
  { nom: 'Caméra', icone: Camera },
  { nom: 'Stories', icone: Users },
  { nom: 'Spotlight', icone: Clapperboard },
]
</script>

<template>
  <div class="coque coque-snaptalk-publication">
    <EnteteApp class="sur-accent" :titre="ecran.appNom" sous-titre="Spotlight" />
    <slot />
    <BarreOnglets :onglets="ONGLETS" actif="Spotlight" />
  </div>
</template>

<style scoped>
/* Anneau de story : liseré blanc puis violet autour de l’avatar du compte. */
.coque-snaptalk-publication :deep(.compte .avatar) { box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #7a2fd0; }
</style>
