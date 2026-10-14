<script setup lang="ts">
import { CirclePlus, CircleUser, Clapperboard, House, ListVideo, Search, Zap } from '@lucide/vue'
import type { Ecran } from '@/content/schema'
import BarreOnglets from './BarreOnglets.vue'

/** StreamTube (publication) : bandeau clair au logo de la marque (pas de triangle de lecture), 5 onglets en bas. */
defineProps<{ ecran: Ecran }>()
const ONGLETS = [
  { nom: 'Accueil', icone: House },
  { nom: 'Courts', icone: Zap },
  { nom: 'Créer', icone: CirclePlus },
  { nom: 'Abonnements', icone: ListVideo },
  { nom: 'Toi', icone: CircleUser },
]
</script>

<template>
  <div class="coque coque-streamtube">
    <div class="entete-app entete-streamtube">
      <span class="logo"><Clapperboard aria-hidden="true" :size="22" /><strong>{{ ecran.appNom }}</strong></span>
      <Search class="recherche" aria-hidden="true" :size="20" />
    </div>
    <slot />
    <BarreOnglets :onglets="ONGLETS" actif="Accueil" />
  </div>
</template>

<style scoped>
.entete-streamtube { flex: none; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--tel-bord); background: var(--tel-fond); color: var(--tel-texte); }
/* Accent de la marque sur fond blanc : même contraste que le blanc sur l’accent (au moins 4.5:1). */
.logo { display: inline-flex; align-items: center; gap: 0.35rem; min-width: 0; overflow-wrap: anywhere; color: var(--marque-accent); }
.logo strong { color: var(--tel-texte); }
.recherche { flex: none; margin-left: auto; color: var(--tel-doux); }
</style>
