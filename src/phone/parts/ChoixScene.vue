<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Choix } from '@/content/schema'
import { ordreAffichage } from '@/engine/ordre'
import type { Mode } from '@/store/progress'

/** QCM à côté du téléphone ; le groupe est nommé par la question (`labelledby` : id du `h2` de l’en-tête). */
const props = defineProps<{ choix: Choix[]; graine: string; mode: Mode; labelledby: string }>()
const emit = defineEmits<{ choisir: [choixId: string] }>()
/** Lettre de chaque réponse, comme dans un QCM : utile pour en parler à voix haute en classe. */
const LETTRES = ['A', 'B', 'C', 'D']
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
  <div class="choix-scene" role="group" :aria-labelledby="labelledby">
    <ul class="liste">
      <li v-for="(c, i) in choixAffiches" :key="c.id">
        <button
          type="button"
          class="btn choix-btn"
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
    <button v-if="mode === 'classe'" type="button" class="btn btn-primaire valider" :disabled="!selection" @click="validerClasse">
      Valider le choix de la classe
    </button>
  </div>
</template>

<style scoped>
.choix-scene { margin-block: 1rem; }
.liste { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }
.choix-btn { gap: 0.75rem; }
.lettre { flex: none; display: grid; place-items: center; width: 1.9rem; height: 1.9rem; border: 2px solid var(--primaire); border-radius: 50%; font-weight: 700; }
.valider { margin-top: 0.75rem; }
</style>
