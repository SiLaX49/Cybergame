<script setup lang="ts">
import { Camera, Clapperboard, MapPin, MessageSquare, Users } from '@lucide/vue'
import type { Ecran } from '@/content/schema'
import EnteteApp from '../parts/EnteteApp.vue'
import BarreOnglets from './BarreOnglets.vue'

/** SnapTalk : avatar à anneau de story, flamme de série, icônes d’état dans les bulles, 5 onglets en bas. */
defineProps<{ ecran: Extract<Ecran, { app: 'sms' | 'chat' }> }>()
const ONGLETS = [
  { nom: 'Carte', icone: MapPin },
  { nom: 'Chat', icone: MessageSquare },
  { nom: 'Caméra', icone: Camera },
  { nom: 'Stories', icone: Users },
  { nom: 'Spotlight', icone: Clapperboard },
]
</script>

<template>
  <div class="coque coque-snaptalk">
    <EnteteApp class="sur-accent avec-story" :titre="ecran.contact" avatar riche>
      <span class="serie" aria-hidden="true">🔥 12</span>
    </EnteteApp>
    <slot />
    <BarreOnglets :onglets="ONGLETS" actif="Chat" />
  </div>
</template>

<style scoped>
/* Anneau de story : liseré blanc puis violet autour de l’avatar. */
.avec-story :deep(.avatar) { box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #7a2fd0; }
.serie { flex: none; font-weight: 700; white-space: nowrap; }
/* Icône d’état : petit carré plein en tête de chaque bulle (bleu pour le contact, rouge pour toi). */
.coque-snaptalk :deep(.bulle .texte)::before {
  content: ''; display: inline-block; width: 0.6em; height: 0.6em; margin-right: 0.4em; border-radius: 2px; background: #2563d9;
}
.coque-snaptalk :deep(.bulle.moi .texte)::before { background: #c8102e; }
</style>
