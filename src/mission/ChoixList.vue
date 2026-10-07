<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Qualite } from '@/content/schema'
import { ordreAffichage } from '@/engine/ordre'
import type { Mode } from '@/store/progress'

/** Choix d’un scénario ou d’un lieu : seuls l’identifiant, le texte et la qualité servent ici. */
const props = withDefaults(
  defineProps<{ choix: { id: string; texte: string; qualite: Qualite }[]; graine: string; mode: Mode; essayes?: string[] }>(),
  { essayes: () => [] },
)
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
    <p v-if="mode === 'binome'" class="consigne-mode encadre encadre-info"><span aria-hidden="true">💬</span> Discutez à deux avant de choisir.</p>
    <p v-if="mode === 'classe'" class="consigne-mode encadre encadre-info">
      <span aria-hidden="true">✋</span> Votez à main levée, puis l’adulte valide le choix de la classe.
    </p>
    <ol class="liste-choix">
      <li v-for="c in choixAffiches" :key="c.id">
        <button
          type="button"
          class="btn choix-btn"
          :data-qualite="c.qualite"
          :data-choix="c.id"
          :class="{ essaye: essayes.includes(c.id) }"
          :disabled="essayes.includes(c.id)"
          :aria-pressed="mode === 'classe' ? selection === c.id : undefined"
          @click="cliquer(c.id)"
        >
          {{ c.texte }}<span v-if="essayes.includes(c.id)" class="deja"> (déjà essayé)</span>
        </button>
      </li>
    </ol>
    <button v-if="mode === 'classe'" type="button" class="btn btn-primaire" :disabled="!selection" @click="validerClasse">
      Valider le choix de la classe
    </button>
  </div>
</template>

<style scoped>
.choix { display: grid; gap: 0.75rem; }
.liste-choix { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.75rem; }
/* Choix déjà essayé : reste lisible (pas d’opacité réduite), signalé par le texte, le trait, le hachuré et la bordure en tirets. */
.choix-btn.essaye { --btn-fond: var(--surface-2); --btn-texte: var(--texte-doux); text-decoration: line-through; border-style: dashed; }
.deja { text-decoration: none; display: inline-block; font-weight: 400; font-style: italic; }
.consigne-mode { font-weight: 700; margin: 0; }
</style>
