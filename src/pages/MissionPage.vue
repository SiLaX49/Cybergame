<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getLeviers, getMission, getTheme } from '@/content'
import { calculerBadges } from '@/engine/badges'
import {
  choixDuRun,
  demarrer,
  etapeCourante,
  reduire,
  resultatSurprise,
  RunError,
  type RunEvent,
  type RunState,
} from '@/engine/mission-runner'
import FilStep from '@/mission/FilStep.vue'
import FinMission from '@/mission/FinMission.vue'
import MinijeuStep from '@/mission/MinijeuStep.vue'
import ScenarioStep from '@/mission/ScenarioStep.vue'
import SensibleAvertissement from '@/mission/SensibleAvertissement.vue'
import { useProgress } from '@/store/useProgress'
import BandeauAide from '@/ui/BandeauAide.vue'

const route = useRoute()
const store = useProgress()

// La page est recréée à chaque changement d'URL (RouterView :key) : pas besoin de réagir à l'id.
const mission = getMission(String(route.params.id))
const theme = mission?.theme ? getTheme(mission.theme) : undefined
const sensible = theme?.sensible ?? false
const leviers = getLeviers()

const mode = computed(() => store.etat.mode ?? 'solo')
const avertissementLu = ref(false)
const etat = ref<RunState | null>(mission ? demarrer(mission) : null)

const etape = computed(() => (mission && etat.value ? etapeCourante(mission, etat.value) : null))
const resultatCourant = computed(() => {
  const r = etape.value && etat.value ? etat.value.resultats[etape.value.id] : undefined
  return r?.type === 'scenario' ? r : undefined
})

function envoyer(evenement: RunEvent) {
  if (!mission || !etat.value) return
  try {
    etat.value = reduire(mission, etat.value, evenement)
  } catch (e) {
    if (e instanceof RunError) return // événement périmé (double clic…) : ignoré
    throw e
  }
  if (etat.value.termine) enregistrer(etat.value)
}

function enregistrer(fin: RunState) {
  if (!mission) return
  if (mission.type === 'rappel') store.enregistrerRappel(mission.id, resultatSurprise(fin))
  else store.enregistrerMission(mission.id, calculerBadges(fin), choixDuRun(fin))
}

function recommencer() {
  if (mission) etat.value = demarrer(mission)
}
</script>

<template>
  <main class="conteneur mission">
    <template v-if="!mission || !etat">
      <h1>Cette mission n’existe plus</h1>
      <p>Elle a peut-être été renommée ou retirée.</p>
      <RouterLink class="btn" to="/carte">Retour à la carte</RouterLink>
    </template>
    <template v-else>
      <header class="mission-entete">
        <h1>{{ mission.titre }}</h1>
        <p v-if="!etat.termine" class="progression">
          <label for="progression-mission">Étape {{ etat.index + 1 }} sur {{ mission.etapes.length }}</label>
          <progress id="progression-mission" :value="etat.index" :max="mission.etapes.length" />
        </p>
      </header>

      <SensibleAvertissement v-if="sensible && !avertissementLu" @commencer="avertissementLu = true" />
      <FinMission v-else-if="etat.termine" :mission="mission" :etat="etat" :leviers="leviers" @rejouer="recommencer" />
      <template v-else-if="etape">
        <ScenarioStep
          v-if="etape.type === 'scenario'"
          :key="etape.id"
          :scenario="etape"
          :phase="etat.phase ?? 'situation'"
          :resultat="resultatCourant"
          :mode="mode"
          :sensible="sensible"
          :leviers="leviers"
          @evenement="envoyer"
        />
        <MinijeuStep
          v-else-if="etape.type === 'minijeu'"
          :key="etape.id"
          :etape="etape"
          :chrono="store.etat.reglages.chrono"
          @evenement="envoyer"
        />
        <FilStep v-else :key="etape.id" :fil="etape" @evenement="envoyer" />
      </template>

      <BandeauAide v-if="sensible && theme" :aides="theme.aides" />
    </template>
  </main>
</template>

<style scoped>
.progression { display: flex; align-items: center; gap: 0.75rem; }
progress { flex: 1; max-width: 20rem; height: 0.8rem; }
</style>
