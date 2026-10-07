<script setup lang="ts">
import { Settings } from '@lucide/vue'
import { nextTick, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ReglagesPanel from '@/ui/ReglagesPanel.vue'

/** Barre unique de la mission ; `etape` (à partir de 1) absente : pas de progression. */
defineProps<{ titre: string; etape?: number; total?: number }>()

const ouvert = ref(false)
const boutonReglages = ref<HTMLButtonElement | null>(null)
async function fermer() {
  ouvert.value = false
  await nextTick()
  boutonReglages.value?.focus()
}
</script>

<template>
  <header class="mission-barre">
    <RouterLink to="/carte" class="retour"><span aria-hidden="true">←</span> Carte</RouterLink>
    <h1>{{ titre }}</h1>
    <p v-if="etape !== undefined && total" class="progression">
      <label for="progression-mission">Étape {{ etape }} sur {{ total }}</label>
      <progress id="progression-mission" :value="etape - 1" :max="total" />
    </p>
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
.mission-barre {
  display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1rem;
  padding-bottom: 0.5rem; border-bottom: 1px solid var(--bord);
}
.retour { font-weight: 700; }
h1 { flex: 1 1 10rem; min-width: 0; margin: 0; font-size: 1.1em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.progression { display: flex; align-items: center; gap: 0.5rem; margin: 0; }
progress { width: 6rem; height: 0.6rem; }
</style>
