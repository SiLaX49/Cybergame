<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import type { Choix } from '@/content/schema'
import { ordreAffichage } from '@/engine/ordre'
import type { Mode } from '@/store/progress'

const props = defineProps<{ choix: Choix[]; graine: string; mode: Mode }>()
const emit = defineEmits<{ choisir: [choixId: string] }>()
/** Lettre de chaque réponse, comme dans un QCM : utile pour en parler à voix haute en classe. */
const LETTRES = ['A', 'B', 'C', 'D']
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
    <div class="entete-qcm">
      <p :id="id" class="intitule">Que fais-tu ?</p>
      <!-- Outil facultatif à côté de la question (bouton « Indice »). -->
      <slot />
    </div>
    <ul class="liste">
      <li v-for="(c, i) in choixAffiches" :key="c.id">
        <button
          type="button"
          class="action"
          :data-choix="c.id"
          :data-qualite="c.qualite"
          :aria-pressed="mode === 'classe' ? selection === c.id : undefined"
          @click="cliquer(c.id)"
        >
          <span class="lettre" aria-hidden="true">{{ LETTRES[i] }}</span>
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
/* QCM : les réponses ne prennent jamais plus de 55 % de l’écran ; au-delà, elles défilent. */
.actions-app { flex: none; max-height: 55%; overflow-y: auto; scrollbar-width: thin; padding: 0.75rem 1rem 1rem; border-top: 1px solid var(--tel-bord); background: var(--tel-fond); }
.entete-qcm { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.6rem; }
.intitule { margin: 0; font-weight: 700; }
.liste { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.action { display: flex; align-items: center; gap: 0.75rem; width: 100%; min-height: 48px; padding: 0.6rem 0.9rem; line-height: 1.4; text-align: left; border: 2px solid var(--tel-bord); border-radius: 12px; background: var(--tel-fond); color: var(--tel-texte); font: inherit; cursor: pointer; }
.action:hover { border-color: var(--tel-accent); }
.action[aria-pressed='true'] { border-color: var(--tel-accent); background: var(--tel-accent); color: var(--tel-accent-texte); }
.lettre { flex: none; display: grid; place-items: center; width: 1.9rem; height: 1.9rem; border: 2px solid var(--tel-accent); border-radius: 50%; font-weight: 700; }
.action:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.valider { margin-top: 0.75rem; justify-content: center; font-weight: 700; border-color: var(--tel-accent); }
.valider:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
