<script setup lang="ts">
import { computed } from 'vue'
import { estIleCalme, ILES_CALMES_INFO, infoIle } from './archipel'

const props = defineProps<{ theme: string }>()
const calme = computed(() => estIleCalme(props.theme))
const couleurs = computed(() => {
  if (estIleCalme(props.theme)) return ILES_CALMES_INFO[props.theme]
  return infoIle(props.theme) ?? null
})
const repere = computed(() => (estIleCalme(props.theme) ? ILES_CALMES_INFO[props.theme].repere : null))
const fleurs = [
  [40, 44],
  [58, 50],
  [78, 43],
]
</script>

<template>
  <svg v-if="couleurs" class="ile-dessin" viewBox="0 0 120 80" aria-hidden="true" focusable="false">
    <ellipse cx="60" cy="68" rx="52" ry="8" fill="#2b6f8f" opacity="0.18" />
    <ellipse cx="60" cy="52" rx="54" ry="22" :fill="couleurs.terre" />
    <ellipse cx="60" cy="46" rx="46" ry="17" :fill="couleurs.herbe" />
    <template v-if="!calme">
      <rect x="26" y="34" width="4" height="14" fill="#6b4a2b" />
      <circle cx="28" cy="30" r="9" fill="#2f7a3f" />
      <rect x="90" y="36" width="4" height="12" fill="#6b4a2b" />
      <circle cx="92" cy="32" r="8" fill="#2f7a3f" />
      <rect x="52" y="34" width="20" height="14" fill="#e9d3a8" stroke="#6b4a2b" stroke-width="1.5" />
      <polygon points="49,35 62,22 75,35" fill="#b5533c" stroke="#6b4a2b" stroke-width="1.5" />
      <rect x="59" y="39" width="6" height="9" fill="#6b4a2b" />
    </template>
    <template v-else-if="repere === 'jardin'">
      <g v-for="(f, i) in fleurs" :key="i">
        <line :x1="f[0]" :y1="f[1]" :x2="f[0]" :y2="f[1]! + 7" stroke="#2f7a3f" stroke-width="1.5" />
        <circle :cx="f[0]" :cy="f[1]" r="3.5" fill="#f4a6c0" />
        <circle :cx="f[0]" :cy="f[1]" r="1.4" fill="#ffd95c" />
      </g>
      <rect x="84" y="40" width="16" height="3" fill="#8a6a45" />
      <rect x="85" y="43" width="2" height="5" fill="#6b4a2b" />
      <rect x="97" y="43" width="2" height="5" fill="#6b4a2b" />
    </template>
    <template v-else>
      <polygon points="52,48 56,18 68,18 72,48" fill="#ffffff" stroke="#8a6a45" stroke-width="1.2" />
      <polygon points="54,38 55,32 69,32 70,38" fill="#c9504a" />
      <polygon points="55,26 56,20 68,20 69,26" fill="#c9504a" />
      <circle cx="62" cy="14" r="9" fill="#ffe27a" opacity="0.25" />
      <rect x="55" y="11" width="14" height="7" fill="#ffe27a" stroke="#8a6a45" stroke-width="1" />
      <polygon points="53,11 62,4 71,11" fill="#8a6a45" />
    </template>
  </svg>
</template>

<style scoped>
.ile-dessin { display: block; width: 100%; height: auto; }
</style>
