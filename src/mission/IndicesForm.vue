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
  <form class="indices" @submit.prevent="emit('valider', [...coches])">
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
