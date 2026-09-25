<script setup lang="ts">
import { Settings, ShieldCheck } from '@lucide/vue'
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import ReglagesPanel from './ReglagesPanel.vue'

const ouvert = ref(false)
</script>

<template>
  <header class="app-header">
    <RouterLink to="/" class="logo"><ShieldCheck aria-hidden="true" /> Cyber Réflexes</RouterLink>
    <nav aria-label="Navigation principale" class="nav">
      <RouterLink to="/enseignants">Enseignants</RouterLink>
      <button
        type="button"
        class="btn"
        aria-controls="panneau-reglages"
        :aria-expanded="ouvert"
        @click="ouvert = !ouvert"
      >
        <Settings aria-hidden="true" /> Réglages
      </button>
    </nav>
  </header>
  <ReglagesPanel v-if="ouvert" @fermer="ouvert = false" />
</template>

<style scoped>
.app-header {
  display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center;
  gap: 0.5rem; padding: 0.5rem 1rem; background: var(--surface); border-bottom: 1px solid var(--bord);
}
.logo { display: inline-flex; align-items: center; gap: 0.4em; font-weight: 700; font-size: 1.2em; text-decoration: none; }
.nav { display: flex; align-items: center; gap: 1rem; }
</style>
