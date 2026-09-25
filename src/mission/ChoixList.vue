<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Scenario } from '@/content/schema'
import { ordreAffichage } from '@/engine/ordre'
import type { Mode } from '@/store/progress'

const props = defineProps<{ choix: Scenario['choix']; graine: string; mode: Mode }>()
const emit = defineEmits<{ choisir: [choixId: string] }>()
const selection = ref<string | null>(null)
const choixAffiches = computed(() => ordreAffichage(props.choix, props.graine))

function cliquer(id: string) {
  if (props.mode === 'classe') selection.value = id
  else emit('choisir', id)
}
function validerClasse() {
  if (selection.value) emit('choisir', selection.value)
}
</script>

<template>
  <div class="choix">
    <p v-if="mode === 'binome'" class="consigne-mode"><span aria-hidden="true">💬</span> Discutez à deux avant de choisir.</p>
    <p v-if="mode === 'classe'" class="consigne-mode">
      <span aria-hidden="true">✋</span> Votez à main levée, puis l’adulte valide le choix de la classe.
    </p>
    <ol class="liste-choix">
      <li v-for="c in choixAffiches" :key="c.id">
        <button
          type="button"
          class="btn choix-btn"
          :data-qualite="c.qualite"
          :data-choix="c.id"
          :aria-pressed="mode === 'classe' ? selection === c.id : undefined"
          @click="cliquer(c.id)"
        >
          {{ c.texte }}
        </button>
      </li>
    </ol>
    <button v-if="mode === 'classe'" type="button" class="btn btn-primaire" :disabled="!selection" @click="validerClasse">
      Valider le choix de la classe
    </button>
  </div>
</template>

<style scoped>
.liste-choix { display: flex; flex-direction: column; gap: 0.6rem; padding-left: 1.5rem; }
.choix-btn { width: 100%; text-align: left; justify-content: flex-start; }
.choix-btn[aria-pressed='true'] { background: var(--primaire); color: var(--primaire-texte); }
.consigne-mode { font-weight: 700; }
</style>
