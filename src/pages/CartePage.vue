<script setup lang="ts">
import { Check, RotateCcw } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getThemes, missionsPour, rappelPour } from '@/content'
import { TRANCHE_LIBELLES, type Tranche } from '@/content/schema'
import { rappelDu } from '@/engine/rappel'
import { useProgress } from '@/store/useProgress'
import { ICONES_THEMES } from '@/ui/icons'

const store = useProgress()
const tranche = computed<Tranche>(() => store.etat.tranche ?? '6e')

const tuiles = computed(() =>
  getThemes().map((theme) => ({ theme, missions: missionsPour(tranche.value, theme.id) })),
)
const rappel = computed(() => rappelPour(tranche.value))
const echeance = computed(() =>
  rappelDu(
    Object.values(store.etat.missions).map((m) => m.termineeLe),
    Object.values(store.etat.rappels),
    new Date(),
  ),
)
const terminee = (id: string) => id in store.etat.missions
</script>

<template>
  <main class="conteneur">
    <h1>Choisis un thème</h1>
    <p>
      Niveau : <strong>{{ TRANCHE_LIBELLES[tranche] }}</strong> ·
      <RouterLink to="/">changer</RouterLink>
    </p>

    <section v-if="rappel" class="carte rappel" :class="{ 'rappel-du': echeance }" aria-labelledby="titre-rappel">
      <h2 id="titre-rappel"><RotateCcw aria-hidden="true" /> Mission rappel</h2>
      <p v-if="echeance">
        C’est le moment de ton rappel ({{ echeance }}) : 5 minutes pour vérifier que les bons réflexes sont
        restés.
      </p>
      <p v-else>5 minutes pour réviser les bons réflexes, quand tu veux.</p>
      <RouterLink class="btn" :class="{ 'btn-primaire': echeance }" :to="`/mission/${rappel.id}`">
        {{ rappel.titre }}
      </RouterLink>
    </section>

    <ul class="grille-themes">
      <li v-for="{ theme, missions } in tuiles" :key="theme.id" class="carte tuile">
        <h2><component :is="ICONES_THEMES[theme.icone]" aria-hidden="true" /> {{ theme.titre }}</h2>
        <p>{{ theme.description }}</p>
        <p v-if="!missions.length" class="bientot">Bientôt disponible</p>
        <ul v-else class="missions">
          <li v-for="m in missions" :key="m.id">
            <RouterLink :to="`/mission/${m.id}`">{{ m.titre }}</RouterLink>
            <span class="meta"> · <template v-if="m.format === 'parcours'">Parcours · </template>{{ m.duree }} min</span>
            <span v-if="terminee(m.id)" class="terminee"> · <Check aria-hidden="true" :size="16" /> Terminée</span>
          </li>
        </ul>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.grille-themes {
  list-style: none; padding: 0; display: grid; gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
}
.tuile h2 { display: flex; align-items: center; gap: 0.4em; font-size: 1.2em; }
.missions { padding-left: 1.1rem; }
.bientot, .meta { color: var(--texte-doux); }
.terminee { color: var(--bon); font-weight: 700; }
.rappel { margin-bottom: 1.5rem; }
.rappel-du { border: 3px solid var(--primaire); }
</style>
