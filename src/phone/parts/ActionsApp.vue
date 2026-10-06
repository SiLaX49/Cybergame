<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import type { Choix } from '@/content/schema'
import { ordreAffichage } from '@/engine/ordre'
import type { Mode } from '@/store/progress'
import { GESTES_TELEPHONE, gesteDuChoix } from '../gestes'

const props = defineProps<{ choix: Choix[]; graine: string; mode: Mode }>()
const emit = defineEmits<{ choisir: [choixId: string] }>()
const id = useId()
const selection = ref<string | null>(null)
const choixAffiches = computed(() => ordreAffichage(props.choix, props.graine))

function cliquer(choixId: string) {
  if (props.mode === 'classe') selection.value = choixId
  else emit('choisir', choixId)
}
function validerClasse() {
  if (selection.value) emit('choisir', selection.value)
}
</script>

<template>
  <div class="actions-app" role="group" :aria-labelledby="id">
    <p :id="id" class="intitule">Que fais-tu ?</p>
    <ul class="liste">
      <li v-for="c in choixAffiches" :key="c.id">
        <button
          type="button"
          class="action"
          :data-choix="c.id"
          :data-qualite="c.qualite"
          :aria-pressed="mode === 'classe' ? selection === c.id : undefined"
          @click="cliquer(c.id)"
        >
          <component :is="GESTES_TELEPHONE[gesteDuChoix(c)].icone" aria-hidden="true" :size="18" />
          <span>{{ c.texte }}</span>
        </button>
      </li>
    </ul>
    <button v-if="mode === 'classe'" type="button" class="action valider" :disabled="!selection" @click="validerClasse">
      Valider le choix de la classe
    </button>
  </div>
</template>

<style scoped>
.actions-app { padding: 0.6rem 0.75rem 0.9rem; border-top: 1px solid var(--tel-bord); background: var(--tel-fond); }
.intitule { margin: 0 0 0.5rem; font-size: 0.85em; font-weight: 700; color: var(--tel-doux); text-align: center; }
.liste { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.45rem; }
.action { display: flex; align-items: center; gap: 0.5rem; width: 100%; min-height: 44px; padding: 0.5rem 0.8rem; text-align: left; border: 2px solid var(--tel-accent); border-radius: 18px; background: var(--tel-fond); color: var(--tel-texte); font: inherit; cursor: pointer; }
.action:hover, .action[aria-pressed='true'] { background: var(--tel-accent); color: var(--tel-accent-texte); }
.action:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.valider { margin-top: 0.6rem; justify-content: center; font-weight: 700; }
.valider:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
