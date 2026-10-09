<script setup lang="ts">
import { BatteryMedium, Signal, Wifi } from '@lucide/vue'

defineProps<{ heure: string }>()
</script>

<template>
  <div class="barre-etat" aria-hidden="true">
    <span>{{ heure }}</span>
    <span class="encoche" />
    <span class="icones"><Signal :size="14" /><Wifi :size="14" /><BatteryMedium :size="16" /></span>
  </div>
</template>

<style scoped>
.barre-etat { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 0.3rem 1rem; font-size: 0.8em; font-weight: 700; background: var(--tel-fond); color: var(--tel-texte); }
.encoche { width: 0.5rem; height: 0.5rem; border-radius: 50%; background: var(--tel-noir); }
.icones { display: inline-flex; gap: 0.3rem; justify-self: end; }
</style>
