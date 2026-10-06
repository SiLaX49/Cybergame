<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { Leviers, Scenario } from '@/content/schema'
import type { PhaseScenario, RunEvent, ScenarioResultat } from '@/engine/mission-runner'
import { ordreAffichage } from '@/engine/ordre'
import Telephone from '@/phone/Telephone.vue'
import { RECUPERATIONS } from '@/recovery/registry'
import type { Mode } from '@/store/progress'
import { focusAuChangement, focusAuMontage } from '@/ui/focus'
import ConsequencePanel from './ConsequencePanel.vue'
import ExplicationPanel from './ExplicationPanel.vue'
import PourquoiForm from './PourquoiForm.vue'

const props = defineProps<{
  scenario: Scenario
  phase: PhaseScenario
  resultat?: ScenarioResultat
  mode: Mode
  sensible: boolean
  leviers: Leviers
  choixId?: string | null
  /** Indice demandé (moteur) : passages surlignés sans numéros avant le choix. */
  indiceVisible?: boolean
}>()
const emit = defineEmits<{ evenement: [evenement: RunEvent] }>()

const TITRES: Record<Exclude<PhaseScenario, 'situation'>, string> = {
  pourquoi: 'Qu’est-ce qui t’a donné envie de le faire ?',
  consequence: 'Et alors, que se passe-t-il ?',
  recuperation: 'Maintenant, limite les dégâts',
}
const CONSIGNES: Record<Mode, string> = {
  solo: 'Choisis ta réponse en bas du téléphone.',
  binome: 'Discutez à deux, puis choisissez en bas du téléphone.',
  classe: 'Votez à main levée, puis l’adulte valide le choix de la classe en bas du téléphone.',
}
const ROLES = { victime: 'la personne visée', temoin: 'un·e témoin', auteur: 'celui ou celle qui a dérapé' } as const

/** Nom accessible de la situation, selon le type d’écran simulé. */
const nomSituation = computed(() => {
  const { app, contact, appNom } = props.scenario.ecran
  if (app === 'mail') return `Situation : mail de ${contact}`
  if (app === 'web') return `Situation : page ${contact}`
  return `Situation : message de ${contact} dans ${appNom}`
})

/** Indices, dans l’ordre d’affichage : même liste pour le téléphone et le panneau, donc mêmes numéros. */
const indices = computed(() => ordreAffichage(props.scenario.indices, props.scenario.id))
const choixJoue = computed(() => (props.phase === 'situation' ? null : (props.choixId ?? null)))

// Après un choix, le panneau garde la question jusqu’à la fin de la séquence jouée dans le téléphone.
const sequenceFinie = ref(false)
watch(
  () => props.phase,
  (phase) => {
    if (phase === 'situation') sequenceFinie.value = false
  },
)
// Le téléphone peut émettre `sequence-finie` pendant le rendu de ce composant (séquence instantanée) : une
// modification faite à cet instant ne relancerait pas son rendu, d’où l’attente du tick suivant.
async function finirSequence() {
  await nextTick()
  sequenceFinie.value = true
}
const phaseAffichee = computed<PhaseScenario>(() => (!choixJoue.value || sequenceFinie.value ? props.phase : 'situation'))
const choix = computed(() => props.scenario.choix.find((c) => c.id === props.choixId))

const situation = ref<HTMLElement | null>(null)
const titre = ref<HTMLElement | null>(null)
focusAuMontage(situation)
// Focus sur le titre au choix (le bouton cliqué disparaît), puis à l’affichage de la phase suivante.
focusAuChangement(() => `${props.phase} ${phaseAffichee.value}`, titre)
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
      <Telephone
        :ecran="scenario.ecran"
        :choix="scenario.choix"
        :mode="mode"
        :graine="scenario.id"
        :choix-joue="choixJoue"
        :indices="indices"
        :indice-visible="indiceVisible"
        @choisir="(id) => emit('evenement', { type: 'choisir', choixId: id })"
        @indice="emit('evenement', { type: 'indice' })"
        @sequence-finie="finirSequence"
      />
      <div class="scenario-panneau">
        <h2 ref="titre" tabindex="-1">{{ phaseAffichee === 'situation' ? scenario.question : TITRES[phaseAffichee] }}</h2>
        <p v-if="phase === 'situation'" class="consigne-mode">{{ CONSIGNES[mode] }}</p>
        <template v-if="phaseAffichee === 'pourquoi' && scenario.pourquoi">
          <ExplicationPanel v-if="choix" :indices="indices" :explication="scenario.explicationIndices" :qualite="choix.qualite" />
          <PourquoiForm
            :pourquoi="scenario.pourquoi"
            :leviers="leviers"
            :graine="scenario.id"
            :mode="mode"
            @expliquer="(levier) => emit('evenement', { type: 'expliquer', levier })"
          />
        </template>
        <ConsequencePanel
          v-if="phaseAffichee === 'consequence' && resultat"
          :scenario="scenario"
          :resultat="resultat"
          :leviers="leviers"
          :indices="indices"
          @continuer="emit('evenement', { type: 'continuer' })"
          @rejouer="emit('evenement', { type: 'rejouer' })"
        />
        <component
          :is="RECUPERATIONS[scenario.recuperation.action]"
          v-if="phaseAffichee === 'recuperation' && scenario.recuperation"
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
.consigne-mode { font-weight: 700; }
.scenario:focus-visible { outline: 3px solid var(--focus); outline-offset: 4px; }
.scenario-grille { display: grid; gap: 1.5rem; grid-template-columns: var(--tel-largeur) minmax(0, 1fr); align-items: start; }
@media (max-width: 48rem) { .scenario-grille { grid-template-columns: minmax(0, 1fr); } }
.role { font-weight: 700; color: var(--primaire); }
</style>
