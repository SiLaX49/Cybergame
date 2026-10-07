<script setup lang="ts">
import { List, RotateCcw } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { CHEMIN } from '@/archipel/archipel'
import ArchipelCarte from '@/archipel/ArchipelCarte.vue'
import { objetsSacoche } from '@/archipel/progression'
import Sacoche from '@/archipel/Sacoche.vue'
import VueListe from '@/archipel/VueListe.vue'
import { getThemes, missionsPour, rappelPour } from '@/content'
import { TRANCHE_LIBELLES, type Tranche } from '@/content/schema'
import { rappelDu } from '@/engine/rappel'
import { useProgress } from '@/store/useProgress'
import Hulotte from '@/ui/Hulotte.vue'

const store = useProgress()
const tranche = computed<Tranche>(() => store.etat.tranche ?? '6e')
const vue = computed(() => store.etat.reglages.vueCarte)
const basculer = () => store.modifierReglages({ vueCarte: vue.value === 'liste' ? 'archipel' : 'liste' })

const objets = computed(() => {
  const ids = new Set(getThemes().map((t) => t.id))
  const iles = CHEMIN.filter((id) => ids.has(id)).map((id) => ({ theme: id, missions: missionsPour(tranche.value, id) }))
  return objetsSacoche(iles, store.etat.missions)
})
const rappel = computed(() => rappelPour(tranche.value))
const echeance = computed(() =>
  rappelDu(
    Object.values(store.etat.missions).map((m) => m.termineeLe),
    Object.values(store.etat.rappels),
    new Date(),
  ),
)
</script>

<template>
  <main class="conteneur">
    <div class="entete-carte">
      <Hulotte expression="reflechit" :taille="72" />
      <h1>Choisis une île</h1>
    </div>
    <p>
      Niveau : <strong>{{ TRANCHE_LIBELLES[tranche] }}</strong> ·
      <RouterLink to="/">changer</RouterLink>
    </p>

    <section
      v-if="rappel"
      class="carte rappel encadre encadre-info"
      :class="{ 'rappel-du': echeance }"
      aria-labelledby="titre-rappel"
    >
      <h2 id="titre-rappel"><RotateCcw aria-hidden="true" /> Mission rappel</h2>
      <p v-if="echeance">
        C’est le moment de ton rappel ({{ echeance }}) : 5 minutes pour vérifier que les bons réflexes sont
        restés.
      </p>
      <p v-else>5 minutes pour réviser les bons réflexes, quand tu veux.</p>
      <RouterLink class="btn" :class="echeance ? 'btn-primaire' : 'btn-secondaire'" :to="`/mission/${rappel.id}`">
        {{ rappel.titre }}
      </RouterLink>
    </section>

    <div class="outils-carte">
      <Sacoche :objets="objets" />
      <button type="button" class="btn btn-secondaire bascule-vue" :aria-pressed="vue === 'liste'" @click="basculer">
        <List aria-hidden="true" /> Vue liste
      </button>
    </div>

    <ArchipelCarte v-if="vue === 'archipel'" :tranche="tranche" />
    <VueListe v-else :tranche="tranche" />
  </main>
</template>

<style scoped>
.entete-carte { display: flex; align-items: center; gap: 0.75rem; }
.entete-carte h1 { margin: 0; }
.outils-carte { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; margin: 0 0 1rem; }
.rappel { margin-bottom: 1.5rem; }
.rappel-du { --encadre-trait: var(--primaire); border-width: 3px; border-left-width: 10px; }
</style>
