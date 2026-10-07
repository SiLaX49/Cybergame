<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Scenario } from '@/content/schema'
import { ordreAffichage } from '@/engine/ordre'

const props = defineProps<{ indices: Scenario['indices']; graine: string }>()
const emit = defineEmits<{ valider: [ids: string[]] }>()
const coches = ref<string[]>([])
const indicesAffiches = computed(() => ordreAffichage(props.indices, props.graine))
</script>

<template>
  <form class="indices carte" @submit.prevent="emit('valider', [...coches])">
    <fieldset>
      <legend>Coche ce qui t’a fait réagir (plusieurs réponses possibles).</legend>
      <label v-for="i in indicesAffiches" :key="i.id" class="option">
        <input v-model="coches" type="checkbox" :value="i.id" /> {{ i.libelle }}
      </label>
    </fieldset>
    <div class="actions">
      <button type="submit" class="btn btn-primaire" :disabled="!coches.length">Valider</button>
      <button type="button" class="btn" @click="emit('valider', [])">Je ne sais pas</button>
    </div>
  </form>
</template>

<style scoped>
.indices fieldset { border: 0; padding: 0; margin: 0 0 1rem; }
.indices legend { padding: 0; margin-bottom: 0.5rem; color: var(--texte-doux); font-family: var(--police-texte); font-weight: 400; }
</style>
