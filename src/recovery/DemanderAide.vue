<script setup lang="ts">
import { computed, ref } from 'vue'
import { DEMANDER_AIDE as T } from './textes'

const emit = defineEmits<{ fait: [] }>()
const choisi = ref<string | null>(null)
const personne = computed(() => T.personnes.find((p) => p.id === choisi.value))
</script>

<template>
  <section class="recuperation carte">
    <h3>{{ T.titre }}</h3>
    <p>{{ T.consigne }}</p>
    <ul class="personnes">
      <li v-for="p in T.personnes" :key="p.id">
        <button type="button" class="btn choix-btn" :aria-pressed="choisi === p.id" @click="choisi = p.id">{{ p.nom }}</button>
      </li>
    </ul>
    <template v-if="personne">
      <p role="status" class="encadre encadre-doux">{{ T.bonChoix }} {{ personne.role }} {{ T.toutes }}</p>
      <button type="button" class="btn btn-primaire" @click="emit('fait')">Continuer</button>
    </template>
  </section>
</template>

<style scoped>
.personnes { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }
.encadre { margin: 0.75rem 0; }
</style>
