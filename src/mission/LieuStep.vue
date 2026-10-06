<script setup lang="ts">
import { Compass } from '@lucide/vue'
import { ref } from 'vue'
import type { Leviers, Lieu } from '@/content/schema'
import type { LieuResultat, PhaseScenario, RunEvent } from '@/engine/mission-runner'
import { RECUPERATIONS } from '@/recovery/registry'
import type { Mode } from '@/store/progress'
import { focusAuChangement, focusAuMontage } from '@/ui/focus'
import { useTexte } from '@/ui/useTexte'
import ChoixList from './ChoixList.vue'
import DecorScene from './DecorScene.vue'
import PourquoiForm from './PourquoiForm.vue'
import ReactionPanel from './ReactionPanel.vue'

const props = defineProps<{
  lieu: Lieu
  phase: PhaseScenario
  resultat?: LieuResultat
  mode: Mode
  sensible: boolean
  leviers: Leviers
}>()
const emit = defineEmits<{ evenement: [evenement: RunEvent] }>()
const t = useTexte()

const TITRES: Record<Exclude<PhaseScenario, 'situation'>, string> = {
  pourquoi: 'Qu’est-ce qui t’a donné envie de le faire ?',
  indices: 'Qu’est-ce qui t’a décidé ?',
  consequence: 'Et alors, que se passe-t-il ?',
  recuperation: 'Maintenant, limite les dégâts',
}

const article = ref<HTMLElement | null>(null)
const titre = ref<HTMLElement | null>(null)
focusAuMontage(article)
focusAuChangement(() => props.phase, titre)
</script>

<template>
  <article ref="article" class="lieu" tabindex="-1" :aria-label="`Lieu : ${lieu.lieu}`">
    <div class="lieu-grille">
      <figure class="lieu-decor">
        <DecorScene :decor="lieu.decor" />
        <figcaption>{{ lieu.lieu }}</figcaption>
      </figure>
      <div class="lieu-panneau">
        <div class="recit carte">
          <Compass aria-hidden="true" class="recit-icone" />
          <p>{{ t(lieu.guide, lieu.guideSimple) }}</p>
        </div>
        <h2 ref="titre" tabindex="-1">{{ phase === 'situation' ? lieu.question : TITRES[phase] }}</h2>
        <p v-if="phase === 'situation' && resultat?.essais.length" class="rester" role="status">
          Tu restes sur ta plateforme : essaie un autre choix.
        </p>
        <ChoixList
          v-if="phase === 'situation'"
          :choix="lieu.choix"
          :essayes="resultat?.essais ?? []"
          :graine="lieu.id"
          :mode="mode"
          @choisir="(id) => emit('evenement', { type: 'choisir', choixId: id })"
        />
        <PourquoiForm
          v-else-if="phase === 'pourquoi' && lieu.pourquoi"
          :pourquoi="lieu.pourquoi"
          :leviers="leviers"
          :graine="lieu.id"
          :mode="mode"
          @expliquer="(levier) => emit('evenement', { type: 'expliquer', levier })"
        />
        <ReactionPanel
          v-else-if="phase === 'consequence' && resultat"
          :lieu="lieu"
          :resultat="resultat"
          :leviers="leviers"
          @continuer="emit('evenement', { type: 'continuer' })"
          @rejouer="emit('evenement', { type: 'rejouer' })"
        />
        <component
          :is="RECUPERATIONS[lieu.recuperation.action]"
          v-else-if="phase === 'recuperation' && lieu.recuperation"
          @fait="emit('evenement', { type: 'recuperation-faite' })"
        />
        <div v-if="sensible" class="actions">
          <button type="button" class="btn btn-discret" @click="emit('evenement', { type: 'passer' })">
            Passer ce lieu
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.lieu:focus { outline: none; }
.lieu:focus-visible { outline: 3px solid var(--focus); outline-offset: 4px; }
.lieu-grille { display: grid; gap: 1.5rem; grid-template-columns: minmax(0, 22rem) minmax(0, 1fr); align-items: start; }
@media (max-width: 48rem) { .lieu-grille { grid-template-columns: minmax(0, 1fr); } }
.lieu-decor { margin: 0; }
.lieu-decor figcaption { margin-top: 0.4rem; font-weight: 700; font-size: 1.1em; }
.recit { display: flex; gap: 0.75rem; align-items: flex-start; border-left: 6px solid var(--primaire); }
.recit p { margin: 0; }
.recit-icone { flex: none; color: var(--primaire); margin-top: 0.2em; }
</style>
