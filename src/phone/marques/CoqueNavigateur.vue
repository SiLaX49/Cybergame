<script setup lang="ts">
import { ChevronLeft, ChevronRight, EllipsisVertical, House } from '@lucide/vue'
import { h, type Component, type FunctionalComponent } from 'vue'
import type { Ecran } from '@/content/schema'
import BarreOnglets from './BarreOnglets.vue'

/** Navigateur : barre d’outils du bas (précédent, suivant, accueil, bouton des onglets ouverts, menu). */
defineProps<{ ecran: Ecran }>()
/** Bouton des onglets : carré arrondi avec le nombre d’onglets ouverts. */
const Onglets: FunctionalComponent = () => h('span', { class: 'compteur-onglets' }, '2')
const ONGLETS: { nom: string; icone: Component }[] = [
  { nom: 'Précédent', icone: ChevronLeft },
  { nom: 'Suivant', icone: ChevronRight },
  { nom: 'Accueil', icone: House },
  { nom: 'Onglets', icone: Onglets },
  { nom: 'Menu', icone: EllipsisVertical },
]
</script>

<template>
  <div class="coque coque-navigateur">
    <slot />
    <BarreOnglets :onglets="ONGLETS" actif="" />
  </div>
</template>

<style scoped>
.coque-navigateur :deep(.compteur-onglets) {
  display: inline-grid; place-items: center; min-width: 1.4rem; height: 1.4rem; border: 2px solid currentColor; border-radius: 5px; font-size: 0.8em;
}
</style>
