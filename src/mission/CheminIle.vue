<script setup lang="ts">
import { computed } from 'vue'
import type { Mission } from '@/content/schema'

const props = defineProps<{ mission: Mission; index: number }>()

const ETATS = { visite: 'déjà visité', ici: 'tu es ici', 'a-venir': 'à venir' } as const
type Etat = keyof typeof ETATS

const etapes = computed(() =>
  props.mission.etapes.map((e, i) => ({
    id: e.id,
    nom: e.type === 'lieu' ? e.lieu : 'Mini-jeu',
    etat: (i < props.index ? 'visite' : i === props.index ? 'ici' : 'a-venir') as Etat,
  })),
)
</script>

<template>
  <section class="chemin-ile" aria-labelledby="titre-chemin">
    <h2 id="titre-chemin" class="visually-hidden">Ton chemin sur l’île</h2>
    <ol class="chemin">
      <li
        v-for="(e, i) in etapes"
        :key="e.id"
        class="halte"
        :class="e.etat"
        :aria-current="e.etat === 'ici' ? 'step' : undefined"
      >
        <span class="pastille" aria-hidden="true">{{ e.etat === 'visite' ? '✓' : i + 1 }}</span>
        <span class="nom">{{ e.nom }}</span>
        <span class="visually-hidden"> ({{ ETATS[e.etat] }})</span>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.chemin { list-style: none; padding: 0; margin: 0 0 1rem; display: flex; flex-wrap: wrap; gap: 0.5rem 0; }
.halte { display: flex; align-items: center; gap: 0.35rem; font-size: 0.9em; }
.halte:not(:last-child)::after { content: ''; width: 1.25rem; border-top: 3px dotted var(--bord); margin: 0 0.4rem; }
.pastille {
  display: inline-grid; place-items: center; width: 1.75rem; height: 1.75rem; min-width: 1.75rem; border-radius: 50%;
  border: 3px solid var(--bord-fort); background: var(--surface); color: var(--texte); font-weight: 700;
}
.visite .pastille { background: var(--bon); border-color: var(--bon); color: var(--surface); }
.ici .pastille { background: var(--primaire); border-color: var(--primaire); color: var(--primaire-texte); box-shadow: 0 3px 0 var(--primaire-ombre); }
.ici .nom { font-weight: 700; text-decoration: underline; text-underline-offset: 0.2em; }
.a-venir .nom { color: var(--texte-doux); }
</style>
