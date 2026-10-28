<script setup lang="ts">
import { computed, useId } from 'vue'
import type { PersonnageId } from '@/store/progress'
import { ILES_INFO, type IleId } from './iles'
import PersonnageG from './PersonnageG.vue'

const props = defineProps<{
  ile: IleId
  etapes: { id: string; nom: string; emoji: string }[]
  position: number
  personnage: PersonnageId
}>()

const HAUTEURS = [170, 145, 160, 130, 150, 120, 105]
/** Les étapes + l’arrivée, de gauche à droite (coordonnées du haut-gauche de chaque plateforme). */
const plateformes = computed(() => {
  const n = props.etapes.length + 1
  const pas = Math.floor(540 / (n - 1))
  return Array.from({ length: n }, (_, i) => ({ x: 20 + i * pas, y: HAUTEURS[i % HAUTEURS.length]! }))
})
/** Courbes en pointillé reliant le haut des plateformes, dans l’ordre. */
const chemin = computed(() =>
  plateformes.value
    .slice(1)
    .map((p, i) => {
      const a = plateformes.value[i]!
      return `M${a.x + 70} ${a.y - 2} Q${(a.x + p.x) / 2 + 45} ${Math.min(a.y, p.y) - 40} ${p.x + 10} ${p.y - 2}`
    })
    .join(' '),
)
const NUAGES = [
  { x: 70, y: 40, s: 1 },
  { x: 250, y: 28, s: 0.8 },
  { x: 420, y: 55, s: 1.1 },
]
const id = useId()
const info = computed(() => ILES_INFO[props.ile])
const arrivee = computed(() => props.position >= props.etapes.length)
const courante = computed(() => Math.min(props.position, plateformes.value.length - 1))
const perso = computed(() => {
  const p = plateformes.value[courante.value]!
  return { transform: `translate(${p.x + 40}px, ${p.y}px)` }
})
const texte = computed(() =>
  arrivee.value
    ? `Arrivée ! Tu as gagné ${info.value.objet.nom}`
    : `Étape ${props.position + 1} sur ${props.etapes.length} : ${props.etapes[props.position]?.nom ?? ''}`,
)
</script>

<template>
  <section class="parcours-scene" :aria-label="info.nom">
    <p class="ile-nom">{{ info.nom }}</p>
    <svg viewBox="0 0 640 260" width="100%" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient :id="`${id}-ciel`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.55" /><stop offset="1" stop-color="#ffffff" stop-opacity="0" />
        </linearGradient>
        <linearGradient :id="`${id}-mer`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.25" /><stop offset="1" stop-color="#0a1430" stop-opacity="0.3" />
        </linearGradient>
      </defs>
      <!-- ciel, soleil, nuages, îles lointaines -->
      <rect width="640" height="260" :fill="info.ciel" />
      <rect width="640" height="200" :fill="`url(#${id}-ciel)`" />
      <circle cx="585" cy="42" r="30" fill="#fff4c2" opacity="0.6" /><circle cx="585" cy="42" r="20" fill="#ffe27a" />
      <g fill="#ffffff" opacity="0.85">
        <g v-for="n in NUAGES" :key="n.x" :transform="`translate(${n.x} ${n.y}) scale(${n.s})`">
          <ellipse cx="0" cy="0" rx="26" ry="10" /><circle cx="-9" cy="-6" r="10" /><circle cx="7" cy="-9" r="13" />
        </g>
      </g>
      <path d="M-10 222 q60 -46 130 -10 q50 -30 120 0 q70 -40 150 2 q60 -26 120 -4 q50 -20 140 0 v20 h-660 z" :fill="info.herbe" opacity="0.35" />
      <!-- mer -->
      <rect y="212" width="640" height="48" :fill="info.mer" />
      <rect y="212" width="640" height="48" :fill="`url(#${id}-mer)`" />
      <path d="M0 220 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#ffffff" stroke-opacity="0.6" stroke-width="3" fill="none" />
      <path d="M20 240 q15 -4 30 0 M210 248 q15 -4 30 0 M400 238 q15 -4 30 0 M560 250 q15 -4 30 0" stroke="#ffffff" stroke-opacity="0.4" stroke-width="2" fill="none" stroke-linecap="round" />
      <!-- chemin pointillé d’une plateforme à l’autre -->
      <path :d="chemin" fill="none" stroke="#ffffff" stroke-opacity="0.8" stroke-width="2.5" stroke-dasharray="2 7" stroke-linecap="round" />
      <g
        v-for="(p, i) in plateformes"
        :key="i"
        :data-plateforme="i"
        :data-courante="i === courante ? '' : undefined"
      >
        <ellipse v-if="i === courante" :cx="p.x + 40" :cy="p.y + 4" rx="48" ry="14" fill="#ffffff" opacity="0.45" />
        <!-- île flottante : terre en pointe, strates, herbe débordante -->
        <path :d="`M${p.x + 2} ${p.y + 8} h76 q-4 18 -18 30 q-10 10 -20 16 q-10 -6 -20 -16 q-14 -12 -18 -30 z`" :fill="info.terre" stroke="#1b1b2e" stroke-opacity="0.25" stroke-width="1.5" />
        <path :d="`M${p.x + 10} ${p.y + 22} q30 6 60 0 M${p.x + 22} ${p.y + 36} q18 5 36 0`" stroke="#000000" stroke-opacity="0.18" stroke-width="2" fill="none" stroke-linecap="round" />
        <path :d="`M${p.x + 54} ${p.y + 20} q20 2 22 -10 z`" fill="#000000" opacity="0.14" />
        <circle :cx="p.x + 30" :cy="p.y + 28" r="2.5" fill="#000000" opacity="0.15" /><circle :cx="p.x + 50" :cy="p.y + 40" r="2" fill="#000000" opacity="0.15" />
        <rect :x="p.x - 2" :y="p.y - 2" width="84" height="13" rx="6.5" :fill="i === plateformes.length - 1 ? '#ffd36b' : info.herbe" stroke="#1b1b2e" stroke-opacity="0.25" stroke-width="1.5" />
        <path :d="`M${p.x + 4} ${p.y + 9} q4 6 8 0 q4 6 8 0 M${p.x + 60} ${p.y + 9} q4 6 8 0 q4 6 8 0`" :fill="i === plateformes.length - 1 ? '#ffd36b' : info.herbe" />
        <rect :x="p.x + 4" :y="p.y" width="40" height="3" rx="1.5" fill="#ffffff" opacity="0.4" />
        <text v-if="i < etapes.length" :x="p.x + 68" :y="p.y - 3" font-size="20" text-anchor="middle">{{ etapes[i]!.emoji }}</text>
        <g v-else>
          <path :d="`M${p.x + 40} ${p.y - 46} l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z`" fill="#fff4c2" />
          <text :x="p.x + 40" :y="p.y - 8" font-size="26" text-anchor="middle">{{ info.objet.emoji }}</text>
        </g>
      </g>
      <g class="perso" :style="perso">
        <g :key="courante" class="saut"><PersonnageG :id="personnage" /></g>
      </g>
    </svg>
    <p class="position" role="status">{{ texte }}<span v-if="arrivee" aria-hidden="true"> {{ info.objet.emoji }}</span></p>
  </section>
</template>

<style scoped>
.parcours-scene { margin-bottom: 1rem; border-radius: var(--rayon-carte); overflow: hidden; border: 2px solid var(--bord); box-shadow: 0 4px 0 var(--bord); }
.ile-nom { margin: 0; padding: 0.3rem 0.8rem; font-weight: 700; background: var(--surface); }
.position { margin: 0; padding: 0.4rem 0.8rem; font-weight: 700; background: var(--surface); }
svg { display: block; }
.perso { transition: transform 0.6s ease-in-out; }
.saut { animation: sauter 0.6s ease-out; }
@keyframes sauter { 0% { transform: translateY(0); } 45% { transform: translateY(-36px); } 100% { transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) { .perso { transition: none; } .saut { animation: none; } }
</style>
