<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Leviers, ReponseLevier, Scenario } from '@/content/schema'
import { ordreAffichage } from '@/engine/ordre'
import type { Mode } from '@/store/progress'

const props = defineProps<{ pourquoi: NonNullable<Scenario['pourquoi']>; leviers: Leviers; graine: string; mode: Mode }>()
const emit = defineEmits<{ expliquer: [levier: ReponseLevier] }>()
const selection = ref<ReponseLevier | null>(null)

const options = computed<{ id: ReponseLevier; libelle: string }[]>(() => [
  ...ordreAffichage(
    props.pourquoi.map((p) => ({ id: p.levier })),
    `${props.graine}:pourquoi`,
  ).map((o) => ({ id: o.id, libelle: props.leviers.leviers[o.id].libelle })),
  { id: 'autre', libelle: props.leviers.autre.libelle },
])

function cliquer(id: ReponseLevier) {
  if (props.mode === 'classe') selection.value = id
  else emit('expliquer', id)
}
function validerClasse() {
  if (selection.value) emit('expliquer', selection.value)
}
</script>

<template>
  <div class="pourquoi">
    <p class="accroche">Beaucoup de gens auraient fait pareil. Choisis ce qui te ressemble le plus.</p>
    <p v-if="mode === 'binome'" class="consigne-mode">
      <span aria-hidden="true">💬</span> Discutez à deux : qu’est-ce qui vous a donné envie ?
    </p>
    <p v-if="mode === 'classe'" class="consigne-mode">
      <span aria-hidden="true">✋</span> Votez à main levée, puis l’adulte valide la raison de la classe.
    </p>
    <ul class="liste-raisons">
      <li v-for="o in options" :key="o.id">
        <button
          type="button"
          class="btn raison-btn"
          :data-levier="o.id"
          :aria-pressed="mode === 'classe' ? selection === o.id : undefined"
          @click="cliquer(o.id)"
        >
          {{ o.libelle }}
        </button>
      </li>
    </ul>
    <button v-if="mode === 'classe'" type="button" class="btn btn-primaire" :disabled="!selection" @click="validerClasse">
      Valider la raison de la classe
    </button>
  </div>
</template>

<style scoped>
.accroche { color: var(--texte-doux); }
.liste-raisons { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
.raison-btn { width: 100%; text-align: left; justify-content: flex-start; }
.raison-btn[aria-pressed='true'] { background: var(--primaire); color: var(--primaire-texte); }
.consigne-mode { font-weight: 700; }
</style>
