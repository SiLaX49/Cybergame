<script setup lang="ts">
import { BatteryMedium, Signal, Wifi } from '@lucide/vue'

defineProps<{ heure: string }>()
</script>

<template>
  <div class="barre-etat" aria-hidden="true">
    <span>{{ heure }}</span>
    <span class="icones"><Signal :size="14" /><Wifi :size="14" /><BatteryMedium :size="16" /></span>
  </div>
</template>

<style scoped>
.barre-etat { display: flex; justify-content: space-between; align-items: center; padding: 0.3rem 1rem; font-size: 0.8em; font-weight: 700; background: var(--tel-coque); color: #fff; }
.icones { display: inline-flex; gap: 0.3rem; }
</style>
