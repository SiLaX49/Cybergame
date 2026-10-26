<script setup lang="ts">
import { computed } from 'vue'
import { PERSONNAGES_INFO } from '@/parcours/personnages'
import type { PersonnageId } from '@/store/progress'

/**
 * L’agent·e cyber du tableau de bord : le personnage choisi par l’élève, en uniforme, qui montre la mission.
 * Décoratif : toujours accompagné d’un texte.
 */
const props = withDefaults(defineProps<{ personnage?: PersonnageId | null; hauteur?: number }>(), {
  personnage: null,
  hauteur: 340,
})
const p = computed(() => PERSONNAGES_INFO[props.personnage ?? 'p3'])
</script>

<template>
  <svg class="agente" :height="hauteur" :width="(hauteur * 200) / 340" viewBox="0 0 200 340" aria-hidden="true" focusable="false">
    <!-- cheveux longs derrière la tête -->
    <path v-if="p.coiffure === 'longs' || p.coiffure === 'chignon'" :fill="p.cheveux" d="M58 70 q-8 50 4 92 l22 -6 q-6 -40 0 -80 z" />
    <!-- jambes et bottes -->
    <rect class="ag-ombre" x="72" y="222" width="22" height="88" rx="8" />
    <rect class="ag-ombre" x="102" y="222" width="22" height="88" rx="8" />
    <rect class="ag-gant" x="66" y="300" width="32" height="18" rx="7" />
    <rect class="ag-gant" x="98" y="300" width="32" height="18" rx="7" />
    <!-- buste -->
    <path class="ag-uniforme" d="M70 132 q28 -14 58 0 l8 60 q-2 34 -6 38 h-62 q-4 -4 -6 -38 z" />
    <path class="ag-ombre" d="M98 128 l-8 22 l8 6 l8 -6 z" />
    <!-- ceinture et boucle -->
    <rect class="ag-ombre" x="66" y="200" width="68" height="12" rx="4" />
    <rect class="ag-or" x="92" y="198" width="16" height="16" rx="3" />
    <!-- insigne -->
    <path class="ag-or" d="M114 150 l12 4 v8 q0 8 -12 12 q-12 -4 -12 -12 v-8 z" />
    <!-- bras gauche, main sur la hanche -->
    <path class="ag-uniforme" d="M72 138 q-22 18 -18 52 q4 14 18 12 l4 -12 q-10 -4 -8 -16 q2 -14 10 -22 z" />
    <circle class="ag-gant" cx="74" cy="196" r="9" />
    <!-- bras droit tendu vers la mission -->
    <path class="ag-uniforme" d="M124 136 q20 2 34 -12 l10 12 q-18 22 -44 22 z" />
    <path class="ag-gant" d="M158 122 l14 -14 q4 -4 8 0 l-10 12 l16 -6 q5 0 3 5 l-18 10 q-6 4 -12 2 z" />
    <!-- cou et tête -->
    <rect :fill="p.peau" x="90" y="108" width="20" height="22" rx="6" />
    <circle :fill="p.peau" cx="100" cy="88" r="30" />
    <circle cx="89" cy="90" r="3.6" fill="#1b1b2e" />
    <circle cx="111" cy="90" r="3.6" fill="#1b1b2e" />
    <circle cx="90.2" cy="88.6" r="1.2" fill="#ffffff" />
    <circle cx="112.2" cy="88.6" r="1.2" fill="#ffffff" />
    <path d="M90 102 q10 8 20 0" stroke="#7a2e2e" stroke-width="2.6" fill="none" stroke-linecap="round" />
    <!-- mèches selon la coiffure -->
    <g :fill="p.cheveux">
      <path v-if="p.coiffure === 'boucles'" d="M70 78 a8 8 0 0 1 8 -10 a8 8 0 0 1 4 12 z M130 78 a8 8 0 0 0 -8 -10 a8 8 0 0 0 -4 12 z" />
      <path v-else-if="p.coiffure === 'courts'" d="M72 80 q2 -14 14 -14 l-6 14 z M128 80 q-2 -14 -14 -14 l6 14 z" />
      <path v-else d="M71 84 q2 -20 22 -20 q-14 8 -16 26 z M129 84 q-2 -20 -22 -20 q14 8 16 26 z" />
      <circle v-if="p.coiffure === 'chignon'" cx="62" cy="96" r="12" />
    </g>
    <!-- casquette -->
    <path class="ag-uniforme" d="M68 72 q4 -34 34 -34 q30 0 32 34 z" />
    <path class="ag-ombre" d="M66 70 h72 q8 0 6 6 h-80 q-4 -6 2 -6 z" />
    <path class="ag-or" d="M101 46 l9 3 v6 q0 6 -9 9 q-9 -3 -9 -9 v-6 z" />
  </svg>
</template>

<style scoped>
.agente { display: block; max-width: 100%; height: auto; }
.ag-uniforme { fill: var(--agent-uniforme); }
.ag-ombre { fill: var(--agent-ombre); }
.ag-gant { fill: var(--agent-gant); }
.ag-or { fill: var(--agent-or); }
</style>
