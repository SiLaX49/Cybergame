<script setup lang="ts">
import { Check, RotateCcw } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getThemes, missionsPour, rappelPour } from '@/content'
import { TRANCHE_LIBELLES, type Tranche } from '@/content/schema'
import { rappelDu } from '@/engine/rappel'
import { useProgress } from '@/store/useProgress'
import Hulotte from '@/ui/Hulotte.vue'
import PastilleTheme from '@/ui/PastilleTheme.vue'

const store = useProgress()
const tranche = computed<Tranche>(() => store.etat.tranche ?? '6e')

const terminee = (id: string) => id in store.etat.missions
const tuiles = computed(() =>
  getThemes().map((theme) => {
    const missions = missionsPour(tranche.value, theme.id)
    return { theme, missions, nbTerminees: missions.filter((m) => terminee(m.id)).length }
  }),
)
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
      <h1>Choisis un thème</h1>
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

    <ul class="grille-themes">
      <li v-for="{ theme, missions, nbTerminees } in tuiles" :key="theme.id" class="carte tuile" :data-accent="theme.id">
        <h2><PastilleTheme :theme="theme" /> {{ theme.titre }}</h2>
        <p>{{ theme.description }}</p>
        <p v-if="!missions.length" class="badge bientot">Bientôt disponible</p>
        <template v-else>
          <p class="progression">
            <progress
              :value="nbTerminees"
              :max="missions.length"
              :aria-label="`Progression ${theme.titre}`"
            ></progress>
            <span class="meta">{{ nbTerminees }} / {{ missions.length }} terminée(s)</span>
          </p>
          <ul class="missions">
            <li v-for="m in missions" :key="m.id">
              <RouterLink :to="`/mission/${m.id}`">{{ m.titre }}</RouterLink>
              <template v-if="m.format === 'parcours'"><span class="sep"> · </span><span class="badge">Parcours</span></template>
              <span class="sep"> · </span>
              <span class="meta">{{ m.duree }} min</span>
              <span v-if="terminee(m.id)" class="badge badge-bon"><Check aria-hidden="true" :size="16" /> Terminée</span>
            </li>
          </ul>
        </template>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.entete-carte { display: flex; align-items: center; gap: 0.75rem; }
.entete-carte h1 { margin: 0; }
.grille-themes {
  list-style: none; padding: 0; display: grid; gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
}
.tuile h2 { display: flex; align-items: center; gap: 0.5em; font-size: 1.2em; margin-top: 0; }
.progression { display: flex; align-items: center; flex-wrap: wrap; gap: 0.25rem 0.75rem; }
.progression progress { flex: 1 1 8rem; }
.missions { list-style: none; padding: 0; margin: 0; }
.missions li {
  display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem 0.6rem;
  padding: 0.5rem 0; border-top: 2px solid var(--bord);
}
.missions a { display: inline-flex; align-items: center; min-height: 44px; font-weight: 700; }
.sep { display: none; }
.meta { color: var(--texte-doux); }
.rappel { margin-bottom: 1.5rem; }
.rappel-du { --encadre-trait: var(--primaire); border-width: 3px; border-left-width: 10px; }
</style>
