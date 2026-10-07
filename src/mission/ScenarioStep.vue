<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Leviers, Scenario } from '@/content/schema'
import type { PhaseScenario, RunEvent, ScenarioResultat } from '@/engine/mission-runner'
import EcranTelephone from '@/phone/EcranTelephone.vue'
import { propsRecuperation, RECUPERATIONS } from '@/recovery/registry'
import type { ContexteSensible } from '@/recovery/textes'
import type { Mode } from '@/store/progress'
import { focusAuChangement, focusAuMontage } from '@/ui/focus'
import ChoixList from './ChoixList.vue'
import ConsequencePanel from './ConsequencePanel.vue'
import IndicesForm from './IndicesForm.vue'
import PourquoiForm from './PourquoiForm.vue'

const props = defineProps<{
  scenario: Scenario
  phase: PhaseScenario
  resultat?: ScenarioResultat
  mode: Mode
  sensible: boolean
  leviers: Leviers
  /** Thème sensible de la mission : adapte les textes des gestes de récupération. */
  contexte?: ContexteSensible
}>()
const emit = defineEmits<{ evenement: [evenement: RunEvent] }>()

const TITRES: Record<Exclude<PhaseScenario, 'situation'>, string> = {
  pourquoi: 'Qu’est-ce qui t’a donné envie de le faire ?',
  indices: 'Qu’est-ce qui t’a décidé ?',
  consequence: 'Et alors, que se passe-t-il ?',
  recuperation: 'Maintenant, limite les dégâts',
}
/** Quand on joue la personne visée, le geste sert d’abord à se protéger. */
const titrePhase = computed(() => {
  if (props.phase === 'situation') return props.scenario.question
  if (props.phase === 'recuperation' && props.scenario.role === 'victime') return 'Maintenant, protège-toi'
  return TITRES[props.phase]
})
const ROLES = { victime: 'la personne visée', temoin: 'un·e témoin', auteur: 'celui ou celle qui a dérapé' } as const

/** Nom accessible de la situation, selon le type d’écran simulé. */
const nomSituation = computed(() => {
  const { app, contact, appNom } = props.scenario.ecran
  if (app === 'mail') return `Situation : mail de ${contact}`
  if (app === 'web') return `Situation : page ${contact}`
  return `Situation : message de ${contact} dans ${appNom}`
})

const situation = ref<HTMLElement | null>(null)
const titre = ref<HTMLElement | null>(null)
focusAuMontage(situation)
focusAuChangement(() => props.phase, titre)
</script>

<template>
  <article
    ref="situation"
    class="scenario"
    tabindex="-1"
    :aria-label="nomSituation"
  >
    <p v-if="scenario.role" class="role">Dans ce scénario, tu joues {{ ROLES[scenario.role] }}.</p>
    <div class="scenario-grille">
      <EcranTelephone :ecran="scenario.ecran" />
      <div class="scenario-panneau">
        <h2 ref="titre" tabindex="-1">{{ titrePhase }}</h2>
        <ChoixList
          v-if="phase === 'situation'"
          :choix="scenario.choix"
          :graine="scenario.id"
          :mode="mode"
          @choisir="(id) => emit('evenement', { type: 'choisir', choixId: id })"
        />
        <PourquoiForm
          v-else-if="phase === 'pourquoi' && scenario.pourquoi"
          :pourquoi="scenario.pourquoi"
          :leviers="leviers"
          :graine="scenario.id"
          :mode="mode"
          @expliquer="(levier) => emit('evenement', { type: 'expliquer', levier })"
        />
        <IndicesForm
          v-else-if="phase === 'indices'"
          :indices="scenario.indices"
          :graine="scenario.id"
          @valider="(ids) => emit('evenement', { type: 'valider-indices', indices: ids })"
        />
        <ConsequencePanel
          v-else-if="phase === 'consequence' && resultat"
          :scenario="scenario"
          :resultat="resultat"
          :leviers="leviers"
          :sensible="sensible"
          @continuer="emit('evenement', { type: 'continuer' })"
          @rejouer="emit('evenement', { type: 'rejouer' })"
        />
        <component
          :is="RECUPERATIONS[scenario.recuperation.action]"
          v-else-if="phase === 'recuperation' && scenario.recuperation"
          v-bind="propsRecuperation(scenario.recuperation.action, contexte)"
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
.scenario:focus { outline: none; }
.scenario:focus-visible { outline: 3px solid var(--focus); outline-offset: 4px; }
.scenario-grille { display: grid; gap: 1.5rem; grid-template-columns: minmax(0, 22rem) minmax(0, 1fr); align-items: start; }
@media (max-width: 48rem) { .scenario-grille { grid-template-columns: minmax(0, 1fr); } }
.role { font-weight: 700; color: var(--primaire); }
</style>
