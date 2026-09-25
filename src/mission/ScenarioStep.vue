<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { Scenario } from '@/content/schema'
import type { PhaseScenario, RunEvent, ScenarioResultat } from '@/engine/mission-runner'
import EcranTelephone from '@/phone/EcranTelephone.vue'
import { RECUPERATIONS } from '@/recovery/registry'
import type { Mode } from '@/store/progress'
import ChoixList from './ChoixList.vue'
import ConsequencePanel from './ConsequencePanel.vue'
import IndicesForm from './IndicesForm.vue'

const props = defineProps<{
  scenario: Scenario
  phase: PhaseScenario
  resultat?: ScenarioResultat
  mode: Mode
  sensible: boolean
}>()
const emit = defineEmits<{ evenement: [evenement: RunEvent] }>()

const TITRES: Record<Exclude<PhaseScenario, 'situation'>, string> = {
  indices: 'Qu’est-ce qui t’a décidé ?',
  consequence: 'Et alors, que se passe-t-il ?',
  recuperation: 'Maintenant, limite les dégâts',
}
const ROLES = { victime: 'la personne visée', temoin: 'un·e témoin', auteur: 'celui ou celle qui a dérapé' } as const

const titre = ref<HTMLElement | null>(null)
watch(
  () => props.phase,
  async () => {
    await nextTick()
    titre.value?.focus()
  },
)
</script>

<template>
  <article class="scenario">
    <p v-if="scenario.role" class="role">Dans ce scénario, tu joues {{ ROLES[scenario.role] }}.</p>
    <div class="scenario-grille">
      <EcranTelephone :ecran="scenario.ecran" />
      <div class="scenario-panneau">
        <h2 ref="titre" tabindex="-1">{{ phase === 'situation' ? scenario.question : TITRES[phase] }}</h2>
        <ChoixList
          v-if="phase === 'situation'"
          :choix="scenario.choix"
          :mode="mode"
          @choisir="(id) => emit('evenement', { type: 'choisir', choixId: id })"
        />
        <IndicesForm
          v-else-if="phase === 'indices'"
          :indices="scenario.indices"
          @valider="(ids) => emit('evenement', { type: 'valider-indices', indices: ids })"
        />
        <ConsequencePanel
          v-else-if="phase === 'consequence' && resultat"
          :scenario="scenario"
          :resultat="resultat"
          @continuer="emit('evenement', { type: 'continuer' })"
          @rejouer="emit('evenement', { type: 'rejouer' })"
        />
        <component
          :is="RECUPERATIONS[scenario.recuperation.action]"
          v-else-if="phase === 'recuperation' && scenario.recuperation"
          @fait="emit('evenement', { type: 'recuperation-faite' })"
        />
        <div v-if="sensible" class="actions">
          <button type="button" class="btn btn-discret" @click="emit('evenement', { type: 'passer' })">
            Passer ce scénario
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.scenario-grille { display: grid; gap: 1.5rem; grid-template-columns: minmax(0, 22rem) minmax(0, 1fr); align-items: start; }
@media (max-width: 48rem) { .scenario-grille { grid-template-columns: minmax(0, 1fr); } }
.role { font-weight: 700; color: var(--primaire); }
h2:focus { outline: none; }
h2:focus-visible { outline: 3px solid var(--focus); }
</style>
