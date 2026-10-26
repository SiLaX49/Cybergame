<script setup lang="ts">
withDefaults(defineProps<{ taille?: number }>(), { taille: 44 })
</script>

<template>
  <svg class="logo-bouclier" :width="taille" :height="taille" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path class="lb-contour" d="M24 3 L42 9 V22 C42 33 34 41 24 45 C14 41 6 33 6 22 V9 Z" />
    <path class="lb-fond" d="M24 7 L38 12 V22 C38 31 32 37.5 24 41 C16 37.5 10 31 10 22 V12 Z" />
    <path class="lb-anse" d="M18.5 22 V18.5 a5.5 5.5 0 0 1 11 0 V22" fill="none" stroke-width="3" />
    <rect class="lb-cadenas" x="15.5" y="21" width="17" height="13" rx="2.5" />
    <circle class="lb-trou" cx="24" cy="27" r="2" />
  </svg>
</template>

<style scoped>
.logo-bouclier { flex: none; }
.lb-contour { fill: var(--primaire); }
.lb-fond { fill: var(--tuile-b); }
.lb-anse { stroke: var(--agent-or); }
.lb-cadenas { fill: var(--agent-or); }
.lb-trou { fill: var(--tuile-b); }
</style>
