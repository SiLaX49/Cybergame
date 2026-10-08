<script setup lang="ts">
import { CloudSun } from '@lucide/vue'
import type { Ecran } from '@/content/schema'
import EnteteApp from '../parts/EnteteApp.vue'

/** Météo : en-tête sur l’accent, température et icône du temps décoratives. Le contenu ne l’ouvre jamais : notifications et accueil. */
defineProps<{ ecran: Ecran }>()
</script>

<template>
  <div class="coque coque-meteo">
    <EnteteApp class="sur-accent" :titre="ecran.appNom">
      <span class="temps" aria-hidden="true"><CloudSun :size="22" /> 14&nbsp;°C</span>
    </EnteteApp>
    <slot />
  </div>
</template>

<style scoped>
.temps { flex: none; margin-left: auto; display: inline-flex; align-items: center; gap: 0.3rem; font-size: 1.1em; font-weight: 700; white-space: nowrap; }
</style>
