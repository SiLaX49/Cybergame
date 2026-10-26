<script setup lang="ts">
import { Circle, CircleCheck } from '@lucide/vue'
import { computed, useId } from 'vue'
import { dateDuJour, objectifsDuJour } from '@/engine/portefeuille'
import { useProgress } from '@/store/useProgress'

const store = useProgress()
const idTitre = useId()
const objectifs = computed(() => objectifsDuJour(store.etat, dateDuJour()))
</script>

<template>
  <section class="panneau" :aria-labelledby="idTitre">
    <h2 :id="idTitre">Objectifs du jour</h2>
    <ul class="objectifs">
      <li v-for="o in objectifs" :key="o.id" :class="{ fait: o.fait }">
        <CircleCheck v-if="o.fait" aria-hidden="true" class="coche" />
        <Circle v-else aria-hidden="true" class="coche" />
        <span>{{ o.libelle }}<span class="visually-hidden">{{ o.fait ? ' : fait' : ' : à faire' }}</span></span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.objectifs { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.6rem; }
.objectifs li { display: flex; align-items: flex-start; gap: 0.6rem; }
.coche { flex: none; margin-top: 0.15em; color: var(--texte-doux); }
.fait .coche { color: var(--bon); }
</style>
