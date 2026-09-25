<script setup lang="ts">
import { ref } from 'vue'
import type { Scenario } from '@/content/schema'

defineProps<{ indices: Scenario['indices'] }>()
const emit = defineEmits<{ valider: [ids: string[]] }>()
const coches = ref<string[]>([])
</script>

<template>
  <form class="indices" @submit.prevent="emit('valider', [...coches])">
    <fieldset>
      <legend>Coche ce qui t’a fait réagir (plusieurs réponses possibles).</legend>
      <label v-for="i in indices" :key="i.id" class="option">
        <input v-model="coches" type="checkbox" :value="i.id" /> {{ i.libelle }}
      </label>
    </fieldset>
    <div class="actions">
      <button type="submit" class="btn btn-primaire" :disabled="!coches.length">Valider</button>
      <button type="button" class="btn" @click="emit('valider', [])">Je ne sais pas</button>
    </div>
  </form>
</template>
