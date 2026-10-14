<script setup lang="ts">
import { Check } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getThemes, missionsPour } from '@/content'
import type { Tranche } from '@/content/schema'
import { useProgress } from '@/store/useProgress'
import PastilleTheme from '@/ui/PastilleTheme.vue'

const props = defineProps<{ tranche: Tranche }>()
const store = useProgress()

const terminee = (id: string) => id in store.etat.missions
const tuiles = computed(() =>
  getThemes().map((theme) => {
    const missions = missionsPour(props.tranche, theme.id)
    return { theme, missions, nbTerminees: missions.filter((m) => terminee(m.id)).length }
  }),
)
</script>

<template>
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
</template>

<style scoped>
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
</style>
