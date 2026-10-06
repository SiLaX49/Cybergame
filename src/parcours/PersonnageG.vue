<script setup lang="ts">
import { computed } from 'vue'
import type { PersonnageId } from '@/store/progress'
import { PERSONNAGES_INFO } from './personnages'

const props = defineProps<{ id: PersonnageId }>()
const p = computed(() => PERSONNAGES_INFO[props.id])
</script>

<template>
  <g class="personnage">
    <rect x="-7" y="-14" width="5" height="14" rx="2" fill="#3a3a5a" />
    <rect x="2" y="-14" width="5" height="14" rx="2" fill="#3a3a5a" />
    <rect x="-11" y="-34" width="22" height="22" rx="7" :fill="p.haut" />
    <path v-if="p.coiffure === 'longs'" d="M-12 -46 q12 -14 24 0 v14 h-24 z" :fill="p.cheveux" />
    <circle cx="0" cy="-44" r="10" :fill="p.peau" />
    <circle cx="-3.5" cy="-45" r="1.4" fill="#222" />
    <circle cx="3.5" cy="-45" r="1.4" fill="#222" />
    <path d="M-3 -40 q3 2.5 6 0" stroke="#222" stroke-width="1.2" fill="none" />
    <path v-if="p.coiffure === 'courts'" d="M-10 -47 q10 -12 20 0 q-10 -4 -20 0 z" :fill="p.cheveux" />
    <g v-else-if="p.coiffure === 'boucles'" :fill="p.cheveux">
      <circle cx="-8" cy="-51" r="5" /><circle cx="0" cy="-54" r="5.5" /><circle cx="8" cy="-51" r="5" />
    </g>
    <path v-else-if="p.coiffure === 'longs'" d="M-10 -48 q10 -10 20 0 q-10 -3 -20 0 z" :fill="p.cheveux" />
    <g v-else :fill="p.cheveux">
      <path d="M-10 -47 q10 -11 20 0 q-10 -4 -20 0 z" /><circle cx="0" cy="-57" r="5" />
    </g>
  </g>
</template>
