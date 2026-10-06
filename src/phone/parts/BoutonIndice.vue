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
  display: flex; align-items: center; gap: 0.35rem; margin: 0 0 0.75rem auto; min-height: 44px; padding: 0.4rem 0.9rem;
  border: 2px solid var(--tel-accent); border-radius: 999px; background: var(--tel-fond); color: var(--tel-texte); font: inherit; font-weight: 700; cursor: pointer;
}
.indice[aria-pressed='true'] { background: var(--tel-passage); color: var(--tel-passage-texte); border-color: var(--tel-passage-texte); }
.indice:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
</style>
