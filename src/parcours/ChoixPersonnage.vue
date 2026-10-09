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
    <label v-for="id in PERSONNAGES" :key="id" class="option option-personnage">
      <input type="radio" :name="name" :value="id" :checked="modelValue === id" @change="emit('update:modelValue', id)" />
      <svg viewBox="-20 -64 40 66" width="48" height="80" aria-hidden="true" focusable="false"><PersonnageG :id="id" /></svg>
      <span>{{ PERSONNAGES_INFO[id].libelle }}</span>
    </label>
  </fieldset>
</template>

<style scoped>
.choix-personnage { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr)); }
.choix-personnage legend { grid-column: 1 / -1; }
.option-personnage { flex-direction: column; justify-content: center; align-items: center; text-align: center; gap: 0.4rem; padding: 0.75rem 0.5rem; min-height: 8.5rem; margin: 0; }
.option-personnage { position: relative; }
.option-personnage input { position: absolute; opacity: 0; inset: 0; width: 100%; height: 100%; margin: 0; cursor: pointer; }
.option-personnage:has(input:checked) { font-weight: 700; box-shadow: 0 4px 0 var(--primaire); }
.option-personnage:has(input:focus-visible) { box-shadow: 0 0 0 6px var(--focus-lisere); }
</style>
