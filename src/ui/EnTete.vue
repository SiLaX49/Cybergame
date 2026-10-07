<script setup lang="ts">
import { Settings } from '@lucide/vue'
import { nextTick, ref } from 'vue'
import ReglagesPanel from './ReglagesPanel.vue'

/** Barre du haut partagée : « gauche » (logo ou retour), « centre » (titre, progression), puis le bouton Réglages. */
defineProps<{ classe: 'app-header' | 'mission-barre' }>()

const ouvert = ref(false)
const boutonReglages = ref<HTMLButtonElement | null>(null)
async function fermer() {
  ouvert.value = false
  await nextTick()
  boutonReglages.value?.focus()
}
</script>

<template>
  <header class="entete" :class="classe">
    <div class="gauche"><slot name="gauche" /></div>
    <div class="centre"><slot name="centre" /></div>
    <button
      ref="boutonReglages"
      type="button"
      class="btn"
      aria-controls="panneau-reglages"
      :aria-expanded="ouvert"
      @click="ouvert = !ouvert"
    >
      <Settings aria-hidden="true" /> Réglages
    </button>
  </header>
  <ReglagesPanel v-if="ouvert" @fermer="fermer" />
</template>

<style scoped>
.entete { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1rem; }
.gauche { display: flex; align-items: center; }
.centre { flex: 1 1 10rem; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1rem; }
.app-header { padding: 0.5rem 1rem; background: var(--surface); border-bottom: 1px solid var(--bord); }
.mission-barre { padding-bottom: 0.5rem; border-bottom: 1px solid var(--bord); }
</style>
