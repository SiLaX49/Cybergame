<script setup lang="ts">
import { PERSONNAGES, type PersonnageId } from '@/store/progress'
import PersonnageG from './PersonnageG.vue'
import { PERSONNAGES_INFO } from './personnages'

withDefaults(defineProps<{ modelValue: PersonnageId | null; legende?: string; name?: string }>(), {
  legende: 'Choisis ton personnage',
  name: 'personnage',
})
const emit = defineEmits<{ 'update:modelValue': [id: PersonnageId] }>()
</script>

<template>
  <fieldset class="choix-personnage">
    <legend>{{ legende }}</legend>
    <label v-for="id in PERSONNAGES" :key="id" class="option-personnage">
      <input type="radio" :name="name" :value="id" :checked="modelValue === id" @change="emit('update:modelValue', id)" />
      <svg viewBox="-20 -64 40 66" width="48" height="80" aria-hidden="true" focusable="false"><PersonnageG :id="id" /></svg>
      <span>{{ PERSONNAGES_INFO[id].libelle }}</span>
    </label>
  </fieldset>
</template>

<style scoped>
.choix-personnage { display: grid; gap: 0.6rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 12rem), 1fr)); }
.option-personnage { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem; border: 2px solid var(--bord); border-radius: var(--rayon); min-height: 44px; }
.option-personnage:has(input:checked) { border-color: var(--primaire); font-weight: 700; }
</style>
