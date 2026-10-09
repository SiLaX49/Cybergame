<script setup lang="ts">
import { Gamepad2, Newspaper, Search } from '@lucide/vue'
import type { Ecran } from '@/content/schema'
import EnteteApp from '../parts/EnteteApp.vue'
import BarreOnglets from './BarreOnglets.vue'

/** Magasin d’applis : bandeau sur l’accent, onglets Aujourd’hui / Jeux / Recherche (la fiche de l’appli est dans la page). */
defineProps<{ ecran: Ecran }>()
const ONGLETS = [
  { nom: 'Aujourd’hui', icone: Newspaper },
  { nom: 'Jeux', icone: Gamepad2 },
  { nom: 'Recherche', icone: Search },
]
</script>

<template>
  <div class="coque coque-magasin">
    <EnteteApp class="sur-accent" :titre="ecran.appNom" />
    <slot />
    <BarreOnglets :onglets="ONGLETS" actif="Recherche" />
  </div>
</template>
