<script setup lang="ts">
import { computed, useId } from 'vue'
import FiltreRelief from '@/ui/FiltreRelief.vue'
import { estIleCalme, ILES_CALMES_INFO, infoIle } from './archipel'

const props = defineProps<{ theme: string }>()
const calme = computed(() => estIleCalme(props.theme))
const couleurs = computed(() => {
  if (estIleCalme(props.theme)) return ILES_CALMES_INFO[props.theme]
  return infoIle(props.theme) ?? null
})
const repere = computed(() => (estIleCalme(props.theme) ? ILES_CALMES_INFO[props.theme].repere : null))
// Identifiants uniques : plusieurs îles sont dessinées sur la même carte.
const id = useId()
const fleurs = [
  [40, 44],
  [58, 50],
  [78, 43],
]
</script>

<template>
  <svg v-if="couleurs" class="ile-dessin" viewBox="0 0 120 80" aria-hidden="true" focusable="false">
    <defs>
      <FiltreRelief :id="`${id}-relief`" :echelle="0.45" :ombre="0.3" />
      <linearGradient :id="`${id}-flanc`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.35" stop-color="#0b1020" stop-opacity="0" />
        <stop offset="1" stop-color="#0b1020" stop-opacity="0.32" />
      </linearGradient>
      <linearGradient :id="`${id}-lumiere`" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.45" />
        <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.05" />
        <stop offset="1" stop-color="#0b1020" stop-opacity="0.2" />
      </linearGradient>
      <mask :id="`${id}-silhouette`" style="mask-type: alpha"><use :href="`#${id}-decor`" /></mask>
      <radialGradient :id="`${id}-reflet`" cx="0.35" cy="0.2" r="0.75">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.38" />
        <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
      </radialGradient>
    </defs>
    <!-- rides dans l’eau et ombre de l’île -->
    <ellipse cx="60" cy="68" rx="56" ry="9" fill="#1b4f6f" opacity="0.2" />
    <path d="M4 62 q6 -3 12 0 M104 62 q6 -3 12 0 M14 72 q5 -2.5 10 0 M96 72 q5 -2.5 10 0" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.7" />
    <!-- flanc de terre, strates, plage, herbe -->
    <ellipse cx="60" cy="53" rx="54" ry="22" :fill="couleurs.terre" />
    <ellipse cx="60" cy="53" rx="54" ry="22" :fill="`url(#${id}-flanc)`" />
    <path d="M14 56 q46 14 92 0 M24 64 q36 9 72 0" fill="none" stroke="#0b1020" stroke-opacity="0.16" stroke-width="1.6" stroke-linecap="round" />
    <ellipse cx="60" cy="47" rx="49" ry="18.5" fill="#f3e2b8" opacity="0.55" />
    <ellipse cx="60" cy="46" rx="46" ry="17" :fill="couleurs.herbe" />
    <ellipse cx="60" cy="46" rx="46" ry="17" :fill="`url(#${id}-reflet)`" />
    <g :filter="`url(#${id}-relief)`">
    <g :id="`${id}-decor`">
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
    </g>
    <rect width="120" height="80" :fill="`url(#${id}-lumiere)`" :mask="`url(#${id}-silhouette)`" />
    </g>
  </svg>
</template>

<style scoped>
.ile-dessin { display: block; width: 100%; height: auto; }
</style>
