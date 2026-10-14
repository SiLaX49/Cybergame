<script setup lang="ts">
import { Lightbulb } from '@lucide/vue'

/** « Indice » avant le choix : se joue une fois, puis reste enfoncé. */
const props = defineProps<{ actif: boolean }>()
const emit = defineEmits<{ indice: [] }>()
</script>

<template>
  <button type="button" class="indice" :aria-pressed="actif" @click="!props.actif && emit('indice')">
    <Lightbulb aria-hidden="true" :size="16" /> Indice
  </button>
</template>

<style scoped>
.indice {
  display: flex; align-items: center; gap: 0.35rem; margin: 0; min-height: 40px; padding: 0.3rem 0.85rem;
  border: 2px solid var(--primaire); border-radius: 999px; background: var(--surface); color: var(--primaire); font: inherit; font-weight: 700; cursor: pointer;
}
.indice[aria-pressed='true'] { background: var(--primaire); color: var(--primaire-texte); }
.indice:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
</style>
