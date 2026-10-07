<script setup lang="ts">
import { computed } from 'vue'
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
      <rect width="640" height="260" :fill="info.ciel" />
      <text v-for="i in 6" :key="`fond-${i}`" :x="i * 105 - 60" :y="40 + (i % 2) * 22" font-size="18" opacity="0.5">{{ info.fond }}</text>
      <rect y="215" width="640" height="45" :fill="info.mer" />
      <path d="M0 222 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#ffffff" stroke-opacity="0.5" stroke-width="3" fill="none" />
      <g
        v-for="(p, i) in plateformes"
        :key="i"
        :data-plateforme="i"
        :data-courante="i === courante ? '' : undefined"
      >
        <polygon :points="`${p.x},${p.y + 10} ${p.x + 80},${p.y + 10} ${p.x + 65},${p.y + 42} ${p.x + 15},${p.y + 42}`" :fill="info.terre" />
        <rect :x="p.x" :y="p.y" width="80" height="12" rx="4" :fill="i === plateformes.length - 1 ? '#ffd36b' : info.herbe" :stroke="i === courante ? '#ffffff' : 'none'" stroke-width="3" />
        <text v-if="i < etapes.length" :x="p.x + 14" :y="p.y - 4" font-size="20">{{ etapes[i]!.emoji }}</text>
        <text v-else :x="p.x + 40" :y="p.y - 8" font-size="26" text-anchor="middle">{{ info.objet.emoji }}</text>
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
