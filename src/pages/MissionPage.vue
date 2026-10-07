<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
import CheminIle from '@/mission/CheminIle.vue'
import FinMission from '@/mission/FinMission.vue'
import LieuStep from '@/mission/LieuStep.vue'
import MissionBarre from '@/mission/MissionBarre.vue'
import MinijeuStep from '@/mission/MinijeuStep.vue'
import ScenarioStep from '@/mission/ScenarioStep.vue'
import SensibleAvertissement from '@/mission/SensibleAvertissement.vue'
import { DECORS_EMOJI, EMOJI_MINIJEU } from '@/parcours/decors'
import ChoixPersonnage from '@/parcours/ChoixPersonnage.vue'
import { estIle } from '@/parcours/iles'
import ParcoursScene from '@/parcours/ParcoursScene.vue'
import type { PersonnageId } from '@/store/progress'
import { useProgress } from '@/store/useProgress'
import BandeauAide from '@/ui/BandeauAide.vue'

const route = useRoute()
const store = useProgress()

// La page est recréée à chaque changement d'URL (RouterView :key) : pas besoin de réagir à l'id.
const mission = getMission(String(route.params.id))
const theme = mission?.theme ? getTheme(mission.theme) : undefined
const sensible = theme?.sensible ?? false
const leviers = getLeviers()

const parcours = mission?.format === 'parcours'
const ile = theme && estIle(theme.id) ? theme.id : null
// Personnage et scène seulement pour un parcours sur une île ; sinon, la progression classique.
const surIle = parcours && !!ile
const etapesScene = (mission?.etapes ?? []).map((e) =>
  e.type === 'lieu'
    ? { id: e.id, nom: e.lieu, emoji: DECORS_EMOJI[e.decor] }
    : { id: e.id, nom: 'Mini-jeu', emoji: EMOJI_MINIJEU },
)
const personnageChoisi = ref<PersonnageId | null>(null)
const titreDepart = ref<HTMLElement | null>(null)
// Le titre de l’écran de départ reçoit le focus dès qu’il s’affiche (après l’avertissement éventuel).
watch(titreDepart, (el) => el?.focus())
function commencerParcours() {
  if (personnageChoisi.value) store.choisirPersonnage(personnageChoisi.value)
}

const mode = computed(() => store.etat.mode ?? 'solo')
const avertissementLu = ref(false)
const etat = ref<RunState | null>(mission ? demarrer(mission) : null)

const etape = computed(() => (mission && etat.value ? etapeCourante(mission, etat.value) : null))
const resultatEtape = computed(() => (etape.value && etat.value ? etat.value.resultats[etape.value.id] : undefined))
const resultatCourant = computed(() => (resultatEtape.value?.type === 'scenario' ? resultatEtape.value : undefined))
const resultatLieu = computed(() => (resultatEtape.value?.type === 'lieu' ? resultatEtape.value : undefined))
/** Mode scène (plein écran, sans défilement de page) : l’étape montre le téléphone. Mêmes conditions que le gabarit. */
const scene = computed(
  () =>
    !!etat.value &&
    !etat.value.termine &&
    !(sensible && !avertissementLu.value) &&
    !(surIle && !store.etat.personnage) &&
    (etape.value?.type === 'scenario' || etape.value?.type === 'fil'),
)

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
  <main class="conteneur mission" :class="{ 'mission--scene': scene }">
    <template v-if="!mission || !etat">
      <MissionBarre titre="Cette mission n’existe plus" />
      <p>Elle a peut-être été renommée ou retirée.</p>
      <RouterLink class="btn" to="/carte">Retour à la carte</RouterLink>
    </template>
    <template v-else>
      <MissionBarre
        :titre="mission.titre"
        :etape="etat.termine || surIle ? undefined : etat.index + 1"
        :total="mission.etapes.length"
      />
      <ParcoursScene
        v-if="surIle && ile && store.etat.personnage"
        :ile="ile"
        :etapes="etapesScene"
        :position="etat.termine ? etapesScene.length : etat.index"
        :personnage="store.etat.personnage"
      />
      <CheminIle v-if="mission.format === 'parcours' && !etat.termine" :mission="mission" :index="etat.index" />

      <SensibleAvertissement v-if="sensible && !avertissementLu" @commencer="avertissementLu = true" />
      <section v-else-if="surIle && !store.etat.personnage" class="choix-depart">
        <h2 ref="titreDepart" tabindex="-1">Avant de partir</h2>
        <ChoixPersonnage v-model="personnageChoisi" />
        <button type="button" class="btn btn-primaire" :disabled="!personnageChoisi" @click="commencerParcours">C’est parti !</button>
      </section>
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
          :choix-id="etat.choixId"
          :indice-visible="etat.indiceUtilise"
          @evenement="envoyer"
        />
        <MinijeuStep
          v-else-if="etape.type === 'minijeu'"
          :key="etape.id"
          :etape="etape"
          :chrono="store.etat.reglages.chrono"
          @evenement="envoyer"
        />
        <LieuStep
          v-else-if="etape.type === 'lieu'"
          :key="etape.id"
          :lieu="etape"
          :phase="etat.phase ?? 'situation'"
          :resultat="resultatLieu"
          :mode="mode"
          :sensible="sensible"
          :leviers="leviers"
          @evenement="envoyer"
        />
        <FilStep v-else-if="etape.type === 'fil'" :key="etape.id" :fil="etape" @evenement="envoyer" />
      </template>

      <BandeauAide v-if="sensible && theme" :aides="theme.aides" />
    </template>
  </main>
</template>

<style scoped>
/*
 * Mode scène : barre, zone de jeu, bandeau d’aide ; la page ne défile pas.
 * Repli en flux si la place manque, si le texte est très grand ou l’interligne large
 * (les em des media queries ignorent la taille de police de la page), ou si les réglages sont ouverts.
 * Les étapes et le téléphone lisent les variables posées ici.
 */
@media (min-width: 48.001em) and (min-height: 34.001em) {
  :root:not([data-taille='tres-grand'], [data-interligne='large']) .mission--scene:not(:has(#panneau-reglages)) {
    height: 100svh;
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 0.75rem;
    padding-block: 0.5rem;
    --scene-conteneur: size;
    --scene-defilement: auto;
    --tel-position: static;
    --tel-hauteur: min(100cqh - 1rem, 60rem);
    --tel-largeur: clamp(30rem, (100cqh - 1rem) * 9 / 10, 46rem);
    max-width: 90rem;
  }
}
</style>
