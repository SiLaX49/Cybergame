<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { contenu, getTheme, getThemes, toutesLesMissions } from '@/content'
import { TRANCHES, TRANCHE_LIBELLES, type Mission, type Tranche } from '@/content/schema'

const CONTACT_URL = import.meta.env.VITE_CONTACT_URL
const tranche = ref<Tranche | ''>('')
const themeId = ref('')

const missions = computed(() =>
  toutesLesMissions().filter(
    (m) =>
      (!tranche.value || m.tranches.includes(tranche.value)) &&
      (!themeId.value || m.theme === themeId.value || m.themesCouverts?.includes(themeId.value)),
  ),
)
const nomTheme = (m: Mission) =>
  m.type === 'rappel' ? 'Rappel (plusieurs thèmes)' : (getTheme(m.theme ?? '')?.titre ?? m.theme)
const miseAJour = new Date(contenu.generatedAt).toLocaleDateString('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
</script>

<template>
  <main class="conteneur">
    <h1>Espace enseignants</h1>
    <p>
      Cyber Réflexes est gratuit, sans compte ni installation. Chaque mission dure 15 à 20 minutes et se termine par
      trois questions de débrief. Le jeu seul ne suffit pas : <strong>c’est le débrief qui ancre les réflexes</strong>,
      et les missions Rappel (J+7, J+30) les entretiennent.
    </p>

    <section class="carte">
      <h2>Une séance type (55 min)</h2>
      <ol>
        <li>5 min : cadre. Personne n’est obligé de raconter une expérience personnelle.</li>
        <li>15 à 20 min : jeu (solo, binôme ou classe entière vidéoprojetée).</li>
        <li>20 min : débrief à partir des trois questions de fin de mission.</li>
        <li>5 min : où trouver de l’aide (3018, adultes de l’établissement).</li>
        <li>5 min : un engagement concret (vérifier un réglage, parler à un adulte…).</li>
      </ol>
    </section>

    <h2>Missions disponibles</h2>
    <div class="filtres">
      <label for="filtre-tranche">Niveau</label>
      <select id="filtre-tranche" v-model="tranche">
        <option value="">Tous</option>
        <option v-for="t in TRANCHES" :key="t" :value="t">{{ TRANCHE_LIBELLES[t] }}</option>
      </select>
      <label for="filtre-theme">Thème</label>
      <select id="filtre-theme" v-model="themeId">
        <option value="">Tous</option>
        <option v-for="t in getThemes()" :key="t.id" :value="t.id">{{ t.titre }}</option>
      </select>
    </div>
    <table v-if="missions.length" class="table-missions">
      <thead>
        <tr><th scope="col">Mission</th><th scope="col">Thème</th><th scope="col">Niveaux</th><th scope="col">Durée</th><th scope="col">Objectifs</th></tr>
      </thead>
      <tbody>
        <tr v-for="m in missions" :key="m.id">
          <td><RouterLink :to="`/enseignants/${m.id}`">{{ m.titre }}</RouterLink></td>
          <td>{{ nomTheme(m) }}</td>
          <td>{{ m.tranches.map((t) => TRANCHE_LIBELLES[t]).join(', ') }}</td>
          <td>{{ m.duree }} min</td>
          <td><ul><li v-for="o in m.objectifs" :key="o">{{ o }}</li></ul></td>
        </tr>
      </tbody>
    </table>
    <p v-else>Aucune mission ne correspond à ces filtres.</p>

    <section>
      <h2>Outils</h2>
      <ul>
        <li><RouterLink to="/test">Test technique du poste (30 secondes)</RouterLink></li>
        <li><RouterLink to="/confidentialite">Confidentialité : aucune donnée ne quitte l’appareil</RouterLink></li>
        <li v-if="CONTACT_URL"><a :href="CONTACT_URL" rel="noopener">Signaler une erreur ou proposer une amélioration</a></li>
      </ul>
      <p>Dernière mise à jour du contenu : {{ miseAJour }}.</p>
    </section>
  </main>
</template>

<style scoped>
.filtres { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1rem; margin-bottom: 1rem; }
select { font: inherit; min-height: 44px; }
.table-missions { width: 100%; border-collapse: collapse; }
.table-missions th, .table-missions td { border-bottom: 1px solid var(--bord); padding: 0.5rem; text-align: left; vertical-align: top; }
</style>
