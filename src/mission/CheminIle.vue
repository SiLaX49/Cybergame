<script setup lang="ts">
import { computed } from 'vue'
import type { Mission } from '@/content/schema'
import { aVenir } from '@/engine/routes'

const props = defineProps<{ mission: Mission; chemin: string[]; courante: string | null }>()

const ETATS = { visite: 'déjà visité', ici: 'tu es ici', 'a-venir': 'à venir' } as const
type Etat = keyof typeof ETATS
type Halte = { id: string; nom: string; etat: Etat; inconnu?: boolean }

const nom = (id: string) => {
  const e = props.mission.etapes.find((x) => x.id === id)
  return e?.type === 'lieu' ? e.lieu : 'Mini-jeu'
}
const etapes = computed<Halte[]>(() => {
  const visites = props.chemin.map((id): Halte => ({ id, nom: nom(id), etat: 'visite' }))
  if (!props.courante) return visites
  const ici: Halte = { id: props.courante, nom: nom(props.courante), etat: 'ici' }
  const suite = aVenir(props.mission.etapes, props.courante).map(
    (id, i): Halte =>
      id ? { id, nom: nom(id), etat: 'a-venir' } : { id: `inconnu-${i}`, nom: 'selon ton choix', etat: 'a-venir', inconnu: true },
  )
  return [...visites, ici, ...suite]
})
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
        <span class="nom" :class="{ inconnu: e.inconnu }">{{ e.nom }}</span>
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
.nom.inconnu { font-style: italic; }
</style>
