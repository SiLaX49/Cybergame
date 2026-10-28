<script setup lang="ts">
import { computed } from 'vue'
import { objetBoutique } from '@/profil/boutique'
import type { PersonnageId } from '@/store/progress'
import { useProgress } from '@/store/useProgress'
import { PERSONNAGES_INFO } from './personnages'

/** Le personnage de l’élève, pieds en (0, 0), tête vers y = −62. Porte l’écusson choisi dans la boutique. */
const props = defineProps<{ id: PersonnageId }>()
const p = computed(() => PERSONNAGES_INFO[props.id])
const store = useProgress()
const ecusson = computed(() => (store.etat.ecusson ? objetBoutique(store.etat.ecusson)?.emoji : undefined))
</script>

<template>
  <g class="personnage">
    <ellipse cx="0" cy="0" rx="10" ry="2" fill="#000000" opacity="0.18" />

    <!-- derrière la tête : cheveux longs, chignon -->
    <path v-if="p.coiffure === 'longs'" d="M-12 -46 q-1.5 15 1.5 25 h21 q3 -10 1.5 -25 z" :fill="p.cheveux" stroke="#1b1b2e" stroke-opacity="0.3" stroke-width="0.8" />
    <circle v-if="p.coiffure === 'chignon'" cx="0" cy="-58.5" r="5.2" :fill="p.cheveux" stroke="#1b1b2e" stroke-opacity="0.3" stroke-width="0.8" />

    <g stroke="#1b1b2e" stroke-opacity="0.3" stroke-width="0.8">
      <!-- jambes et baskets -->
      <rect x="-6.5" y="-16" width="5.5" height="13" rx="2.5" fill="#2e3a5c" />
      <rect x="1" y="-16" width="5.5" height="13" rx="2.5" fill="#2e3a5c" />
      <path d="M-8.5 -1 q0 -4 3.5 -4 h3.5 q1.2 0 1.2 1.6 v2.4 z" fill="#f4f6fb" />
      <path d="M0.3 -1 q0 -4 3.5 -4 h3.5 q1.2 0 1.2 1.6 v2.4 z" fill="#f4f6fb" />
      <!-- bras, mains -->
      <rect x="-14" y="-32" width="5" height="15" rx="2.5" :fill="p.haut" transform="rotate(8 -11.5 -32)" />
      <rect x="9" y="-32" width="5" height="15" rx="2.5" :fill="p.haut" transform="rotate(-8 11.5 -32)" />
      <circle cx="-13.5" cy="-17" r="2.7" :fill="p.peau" />
      <circle cx="13.5" cy="-17" r="2.7" :fill="p.peau" />
      <!-- buste -->
      <path d="M-10 -34 q10 -4 20 0 l1.5 18 q-11.5 3 -23 0 z" :fill="p.haut" />
    </g>
    <path d="M3 -35.6 q4 0.6 7 1.6 l1.5 18 q-4 1 -8.5 1.2 z" fill="#000000" opacity="0.12" />
    <path d="M-5 -34.5 q5 4.5 10 0" fill="none" stroke="#ffffff" stroke-opacity="0.6" stroke-width="1.2" stroke-linecap="round" />
    <path d="M-7 -20.5 h14" stroke="#000000" stroke-opacity="0.18" stroke-width="1" />

    <!-- écusson porté -->
    <g v-if="ecusson" class="ecusson" transform="translate(-4.5 -27)">
      <circle r="4.6" fill="#f5b72e" stroke="#8a5a00" stroke-width="0.8" />
      <circle r="3.5" fill="#fff6db" />
      <text y="1.8" font-size="5" text-anchor="middle">{{ ecusson }}</text>
    </g>

    <!-- cou, oreilles, tête -->
    <g stroke="#1b1b2e" stroke-opacity="0.3" stroke-width="0.8" :fill="p.peau">
      <rect x="-2.5" y="-37" width="5" height="4" stroke="none" />
      <circle cx="-10.6" cy="-44" r="2.4" />
      <circle cx="10.6" cy="-44" r="2.4" />
      <circle cx="0" cy="-45" r="11" />
    </g>
    <!-- visage -->
    <ellipse cx="-4" cy="-44.2" rx="1.5" ry="1.9" fill="#1b1b2e" />
    <ellipse cx="4" cy="-44.2" rx="1.5" ry="1.9" fill="#1b1b2e" />
    <circle cx="-3.5" cy="-44.9" r="0.55" fill="#ffffff" />
    <circle cx="4.5" cy="-44.9" r="0.55" fill="#ffffff" />
    <path d="M-6 -48.3 q2 -1.2 4 0 M2 -48.3 q2 -1.2 4 0" :stroke="p.cheveux" stroke-width="1.1" stroke-linecap="round" fill="none" />
    <ellipse cx="-6.6" cy="-41.3" rx="1.8" ry="1.1" fill="#ff7a8a" opacity="0.45" />
    <ellipse cx="6.6" cy="-41.3" rx="1.8" ry="1.1" fill="#ff7a8a" opacity="0.45" />
    <path d="M-2.4 -40 q2.4 2.2 4.8 0" stroke="#7a2e2e" stroke-width="1" stroke-linecap="round" fill="none" />

    <!-- cheveux devant -->
    <g :fill="p.cheveux" stroke="#1b1b2e" stroke-opacity="0.3" stroke-width="0.8">
      <g v-if="p.coiffure === 'boucles'">
        <circle cx="-11" cy="-46" r="3.6" /><circle cx="-9" cy="-50.5" r="4.5" /><circle cx="-4" cy="-54" r="5" />
        <circle cx="2" cy="-55" r="5" /><circle cx="7.5" cy="-52" r="4.5" /><circle cx="10.8" cy="-47" r="3.6" />
      </g>
      <path v-else-if="p.coiffure === 'courts'" d="M-11.5 -45 q0 -12 11.5 -12 q11.5 0 11.5 12 q-3 -5 -7 -6 q-4 3 -9 1 q-4 1 -7 5 z" />
      <path v-else-if="p.coiffure === 'longs'" d="M-11.8 -44 q-0.5 -13.5 11.8 -13.5 q12.3 0 11.8 13.5 q-2 -6 -6 -8 q-6 4 -14 3 q-3 2 -3.6 5 z" />
      <path v-else d="M-11.5 -45 q0 -12.5 11.5 -12.5 q11.5 0 11.5 12.5 q-5 -6 -11.5 -6 q-6.5 0 -11.5 6 z" />
    </g>
    <path d="M-6 -53.5 q3 -2 6 -1.8" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1.2" stroke-linecap="round" fill="none" />
  </g>
</template>
