<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { contenu, getTheme, getThemes, toutesLesMissions } from '@/content'
import { TRANCHES, TRANCHE_LIBELLES, type Mission, type Tranche } from '@/content/schema'
import PastilleTheme from '@/ui/PastilleTheme.vue'

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
const themeDe = (m: Mission) => (m.theme ? getTheme(m.theme) : undefined)
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
    <div v-if="missions.length" class="table-defile carte" role="region" aria-label="Liste des missions (défilement horizontal)" tabindex="0">
      <table class="table-missions">
        <thead>
          <tr><th scope="col">Mission</th><th scope="col">Thème</th><th scope="col">Niveaux</th><th scope="col">Durée</th><th scope="col">Objectifs</th></tr>
        </thead>
        <tbody>
          <tr v-for="m in missions" :key="m.id">
            <td>
              <RouterLink :to="`/enseignants/${m.id}`">{{ m.titre }}</RouterLink>
              <div class="etiquettes">
                <span v-if="m.format === 'parcours'" class="badge">Parcours</span>
                <span v-if="m.relecture?.statut === 'a-relire'" class="badge badge-aide">Brouillon</span>
              </div>
            </td>
            <td>
              <span class="theme-cellule">
                <PastilleTheme v-if="themeDe(m)" :theme="themeDe(m)!" :taille="20" />
                <span>{{ nomTheme(m) }}</span>
              </span>
            </td>
            <td>
              <span class="etiquettes">
                <span v-for="t in m.tranches" :key="t" class="badge">{{ TRANCHE_LIBELLES[t] }}</span>
              </span>
            </td>
            <td><span class="badge">{{ m.duree }} min</span></td>
            <td><ul><li v-for="o in m.objectifs" :key="o">{{ o }}</li></ul></td>
          </tr>
        </tbody>
      </table>
    </div>
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
.table-defile { overflow-x: auto; padding: 0.5rem; }
.table-missions { width: 100%; min-width: 40rem; border-collapse: collapse; }
.table-missions th, .table-missions td { border-bottom: 1px solid var(--bord); padding: 0.6rem 0.5rem; text-align: left; vertical-align: top; }
.table-missions tbody tr:last-child td { border-bottom: 0; }
.table-missions th { font-family: var(--police-titres); }
.table-missions ul { margin: 0; padding-left: 1.1rem; }
.etiquettes { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.3rem; }
td > .etiquettes:first-child { margin-top: 0; }
.theme-cellule { display: inline-flex; align-items: center; gap: 0.5rem; }
.theme-cellule :deep(.pastille-theme) { width: 2rem; height: 2rem; border-radius: 10px; }
</style>
