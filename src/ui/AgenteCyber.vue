<script setup lang="ts">
import { computed } from 'vue'
import { PERSONNAGES_INFO } from '@/parcours/personnages'
import { objetBoutique } from '@/profil/boutique'
import type { PersonnageId } from '@/store/progress'
import { useProgress } from '@/store/useProgress'

/**
 * L’agent·e cyber du tableau de bord : le personnage choisi par l’élève, en uniforme, qui montre la mission.
 * Décoratif : toujours accompagné d’un texte.
 */
const props = withDefaults(defineProps<{ personnage?: PersonnageId | null; hauteur?: number }>(), {
  personnage: null,
  hauteur: 340,
})
const p = computed(() => PERSONNAGES_INFO[props.personnage ?? 'p3'])
const store = useProgress()
const ecusson = computed(() => (store.etat.ecusson ? objetBoutique(store.etat.ecusson)?.emoji : undefined))
</script>

<template>
  <svg class="agente" :height="hauteur" :width="(hauteur * 200) / 340" viewBox="0 0 200 340" aria-hidden="true" focusable="false">
    <ellipse class="ag-sol" cx="100" cy="320" rx="50" ry="7" />
    <!-- cheveux derrière la tête -->
    <path v-if="p.coiffure === 'longs'" class="ag-trait" :fill="p.cheveux" d="M66 74 q-14 50 -2 96 l26 -8 q-8 -42 -2 -82 z M134 74 q14 50 2 96 l-26 -8 q8 -42 2 -82 z" />
    <g class="ag-trait">
      <!-- jambes et bottes -->
      <rect class="ag-ombre" x="72" y="222" width="24" height="86" rx="9" />
      <rect class="ag-ombre" x="104" y="222" width="24" height="86" rx="9" />
      <path class="ag-gant" d="M64 318 q0 -20 18 -20 h10 q6 0 6 8 v12 z" />
      <path class="ag-gant" d="M102 318 v-12 q0 -8 6 -8 h10 q18 0 18 20 z" />
      <!-- bras gauche, main sur la hanche -->
      <path class="ag-uniforme" d="M72 138 q-24 18 -20 54 q4 14 20 12 l4 -12 q-10 -4 -8 -16 q2 -14 10 -22 z" />
      <circle class="ag-gant" cx="74" cy="197" r="10" />
      <!-- buste -->
      <path class="ag-uniforme" d="M68 134 q32 -16 64 0 l6 58 q-2 34 -6 38 h-64 q-4 -4 -6 -38 z" />
    </g>
    <path class="ag-reflet" d="M112 128 q14 2 20 6 l6 58 q-2 34 -6 38 h-16 q6 -40 -4 -102 z" />
    <g class="ag-trait">
      <!-- col, épaulettes, poche -->
      <path class="ag-ombre" d="M100 126 l-14 26 l14 10 l14 -10 z" />
      <path class="ag-blanc" d="M88 128 l12 14 l12 -14 l-6 -2 l-6 8 l-6 -8 z" />
      <rect class="ag-or" x="62" y="130" width="22" height="7" rx="3.5" transform="rotate(-18 73 133)" />
      <rect class="ag-or" x="116" y="130" width="22" height="7" rx="3.5" transform="rotate(18 127 133)" />
      <!-- ceinture -->
      <rect class="ag-ombre" x="64" y="200" width="72" height="13" rx="5" />
      <rect class="ag-or" x="91" y="197" width="18" height="19" rx="4" />
      <!-- bras droit tendu vers la mission -->
      <path class="ag-uniforme" d="M126 136 q22 2 34 -14 l12 12 q-20 24 -46 24 z" />
      <path class="ag-gant" d="M160 120 l14 -14 q4 -4 8 0 l-10 12 l16 -6 q6 0 3 6 l-18 10 q-6 4 -12 2 z" />
    </g>
    <!-- écusson (celui de la boutique, sinon l’insigne de l’agence) -->
    <g transform="translate(116 165)">
      <circle class="ag-or ag-trait" r="15" />
      <circle class="ag-blanc" r="11.5" />
      <text v-if="ecusson" y="6" font-size="16" text-anchor="middle">{{ ecusson }}</text>
      <path v-else class="ag-uniforme" d="M0 -8 l7 2.5 v5 q0 6 -7 9 q-7 -3 -7 -9 v-5 z" />
    </g>
    <!-- cou, oreilles, tête -->
    <g class="ag-trait" :fill="p.peau">
      <rect x="90" y="106" width="20" height="24" rx="6" />
      <circle cx="70" cy="90" r="7" />
      <circle cx="130" cy="90" r="7" />
      <circle cx="100" cy="88" r="30" />
    </g>
    <circle v-if="p.coiffure === 'chignon'" class="ag-trait" :fill="p.cheveux" cx="100" cy="36" r="13" />
    <!-- visage -->
    <path d="M82 81 q6 -4 12 0 M106 81 q6 -4 12 0" :stroke="p.cheveux" stroke-width="3" stroke-linecap="round" fill="none" />
    <ellipse cx="88" cy="91" rx="4" ry="5" fill="#1b1b2e" />
    <ellipse cx="112" cy="91" rx="4" ry="5" fill="#1b1b2e" />
    <circle cx="89.5" cy="89" r="1.5" fill="#ffffff" />
    <circle cx="113.5" cy="89" r="1.5" fill="#ffffff" />
    <ellipse cx="80" cy="100" rx="5" ry="3" fill="#ff7a8a" opacity="0.45" />
    <ellipse cx="120" cy="100" rx="5" ry="3" fill="#ff7a8a" opacity="0.45" />
    <path d="M92 103 q8 8 16 0" stroke="#7a2e2e" stroke-width="2.6" fill="#ffffff" stroke-linecap="round" stroke-linejoin="round" />
    <!-- mèches selon la coiffure -->
    <g class="ag-trait" :fill="p.cheveux">
      <g v-if="p.coiffure === 'boucles'">
        <circle cx="72" cy="78" r="8" /><circle cx="128" cy="78" r="8" /><circle cx="70" cy="92" r="6" /><circle cx="130" cy="92" r="6" />
      </g>
      <path v-else-if="p.coiffure === 'courts'" d="M71 82 q1 -16 16 -16 l-7 16 z M129 82 q-1 -16 -16 -16 l7 16 z" />
      <path v-else d="M70 86 q2 -22 24 -22 q-15 9 -17 28 z M130 86 q-2 -22 -24 -22 q15 9 17 28 z" />
    </g>
    <!-- casquette -->
    <g class="ag-trait">
      <path class="ag-uniforme" d="M66 72 q4 -36 36 -36 q32 0 34 36 z" />
      <path class="ag-ombre" d="M62 70 h78 q10 0 6 8 h-86 q-6 -8 2 -8 z" />
      <path class="ag-or" d="M101 44 l10 3.5 v7 q0 7 -10 10 q-10 -3 -10 -10 v-7 z" />
    </g>
    <path class="ag-reflet-clair" d="M78 56 q10 -14 24 -14" />
  </svg>
</template>

<style scoped>
.agente { display: block; max-width: 100%; height: auto; }
.ag-trait { stroke: var(--agent-gant); stroke-width: 2.2; stroke-linejoin: round; }
.ag-uniforme { fill: var(--agent-uniforme); }
.ag-ombre { fill: var(--agent-ombre); }
.ag-gant { fill: var(--agent-gant); }
.ag-or { fill: var(--agent-or); }
.ag-blanc { fill: var(--tuile-texte); }
.ag-reflet { fill: var(--agent-gant); opacity: 0.25; }
.ag-reflet-clair { fill: none; stroke: var(--tuile-texte); stroke-opacity: 0.45; stroke-width: 3; stroke-linecap: round; }
.ag-sol { fill: var(--agent-gant); opacity: 0.25; }
</style>
