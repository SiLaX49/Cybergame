<script setup lang="ts">
import { CalendarClock, Clock, MessagesSquare, ShieldCheck } from '@lucide/vue'
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
/** La séance type, étape par étape (durée affichée à part). */
const SEANCE = [
  { duree: '5 min', quoi: 'Cadre. Personne n’est obligé de raconter une expérience personnelle.' },
  { duree: '15 à 25 min', quoi: 'Jeu (solo, binôme ou classe entière vidéoprojetée).' },
  { duree: '20 min', quoi: 'Débrief à partir des trois questions de fin de mission.' },
  { duree: '5 min', quoi: 'Où trouver de l’aide (3018, adultes de l’établissement).' },
  { duree: '5 min', quoi: 'Un engagement concret (vérifier un réglage, parler à un adulte…).' },
]
</script>


<template>
  <main class="conteneur enseignants">
    <header class="carte entete">
      <p class="surtitre">Pour les enseignant·es</p>
      <h1>Espace enseignants</h1>
      <p class="intro">
        Cyber Réflexes est gratuit, sans compte ni installation. Chaque mission dure 15 à 25 minutes et se termine par
        trois questions de débrief. Le jeu seul ne suffit pas : <strong>c’est le débrief qui ancre les réflexes</strong>,
        et les missions Rappel (J+7, J+30) les entretiennent.
      </p>
      <ul class="chiffres" aria-label="En bref">
        <li><Clock aria-hidden="true" :size="20" /><span><strong>15 à 25 min</strong> par mission</span></li>
        <li><MessagesSquare aria-hidden="true" :size="20" /><span><strong>3 questions</strong> de débrief</span></li>
        <li><CalendarClock aria-hidden="true" :size="20" /><span><strong>Rappels</strong> à J+7 et J+30</span></li>
        <li><ShieldCheck aria-hidden="true" :size="20" /><span><strong>Aucune donnée</strong> ne quitte l’appareil</span></li>
      </ul>
    </header>

    <div class="grille-haut">
      <section class="carte" aria-labelledby="titre-seance">
        <h2 id="titre-seance" class="carte-titre">Une séance type (50 à 60 min)</h2>
        <ol class="seance">
          <li v-for="(e, i) in SEANCE" :key="i">
            <span class="seance-numero" aria-hidden="true">{{ i + 1 }}</span>
            <span class="seance-texte">{{ e.quoi }}</span>
            <span class="badge seance-duree">{{ e.duree }}</span>
          </li>
        </ol>
      </section>

      <section class="carte outils" aria-labelledby="titre-outils">
        <h2 id="titre-outils" class="carte-titre">Outils</h2>
        <ul>
          <li><RouterLink to="/test">Test technique du poste (30 secondes)</RouterLink></li>
          <li><RouterLink to="/confidentialite">Confidentialité : aucune donnée ne quitte l’appareil</RouterLink></li>
          <li v-if="CONTACT_URL"><a :href="CONTACT_URL" rel="noopener">Signaler une erreur ou proposer une amélioration</a></li>
        </ul>
        <p class="mise-a-jour">Dernière mise à jour du contenu : {{ miseAJour }}.</p>
      </section>
    </div>

    <section class="carte missions" aria-labelledby="titre-missions">
      <div class="missions-entete">
        <div>
          <h2 id="titre-missions" class="carte-titre">Missions disponibles</h2>
          <p class="carte-sous-titre" aria-live="polite">{{ missions.length }} mission{{ missions.length > 1 ? 's' : '' }}</p>
        </div>
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
      </div>
      <div v-if="missions.length" class="table-defile" role="region" aria-label="Liste des missions (défilement horizontal)" tabindex="0">
        <table class="table-missions">
          <thead>
            <tr><th scope="col">Mission</th><th scope="col">Thème</th><th scope="col">Niveaux</th><th scope="col">Durée</th><th scope="col">Objectifs</th></tr>
          </thead>
          <tbody>
            <tr v-for="m in missions" :key="m.id">
              <td class="cellule-mission">
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
              <td class="objectifs"><ul><li v-for="o in m.objectifs" :key="o">{{ o }}</li></ul></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else>Aucune mission ne correspond à ces filtres.</p>
    </section>
  </main>
</template>

<style scoped>
.enseignants { display: grid; gap: 1.5rem; padding-block: 2.5rem; }
.carte-titre { margin: 0; font-size: 1.15em; }
.carte-sous-titre { margin: 0.2rem 0 0; color: var(--texte-doux); font-size: 0.9em; }

.entete { background: linear-gradient(to bottom right, var(--surface), var(--surface-2)); }
.entete h1 { margin: 0; }
.intro { margin: 0.5rem 0 1.25rem; color: var(--texte-doux); max-width: 50rem; }
.intro strong { color: var(--texte); }
.chiffres {
  list-style: none; margin: 0; padding: 0;
  display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
}
.chiffres li {
  display: flex; align-items: center; gap: 0.65rem; padding: 0.75rem 1rem;
  background: var(--surface); border: 1px solid var(--bord); border-radius: 14px; font-size: 0.9em;
}
.chiffres svg { flex: none; color: var(--primaire); }
.chiffres strong { display: block; font-size: 1.05em; }

.grille-haut { display: grid; gap: 1.5rem; grid-template-columns: minmax(0, 2fr) minmax(16rem, 1fr); align-items: start; }
.seance { list-style: none; margin: 1rem 0 0; padding: 0; }
.seance li {
  display: grid; grid-template-columns: 2rem minmax(0, 1fr) auto; align-items: center; gap: 0.75rem;
  padding: 0.65rem 0; border-bottom: 1px solid var(--bord);
}
.seance li:last-child { border-bottom: 0; }
.seance-numero {
  display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 50%;
  border: 2px solid var(--primaire); font-weight: 700; font-size: 0.85em;
}
.seance-duree { justify-self: end; }
.outils ul { margin: 0.75rem 0 0; padding-left: 1.1rem; display: grid; gap: 0.4rem; }
.mise-a-jour { margin: 1rem 0 0; padding-top: 0.75rem; border-top: 1px solid var(--bord); color: var(--texte-doux); font-size: 0.85em; }

.missions-entete { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
.filtres { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.75rem; }
.filtres label { font-weight: 600; font-size: 0.9em; }
.table-defile { overflow-x: auto; }
.table-missions { width: 100%; min-width: 44rem; border-collapse: collapse; }
.table-missions th, .table-missions td { border-bottom: 1px solid var(--bord); padding: 0.85rem 0.75rem; text-align: left; vertical-align: top; }
.table-missions thead th {
  padding-top: 0.6rem; padding-bottom: 0.6rem; background: var(--surface-2); color: var(--texte-doux);
  font-size: 0.75em; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
}
.table-missions thead th:first-child { border-radius: 10px 0 0 10px; }
.table-missions thead th:last-child { border-radius: 0 10px 10px 0; }
.table-missions tbody tr:last-child td { border-bottom: 0; }
.cellule-mission a { font-weight: 600; }
.objectifs { font-size: 0.9em; color: var(--texte-doux); }
.table-missions ul { margin: 0; padding-left: 1.1rem; }
.etiquettes { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.4rem; }
td > .etiquettes:first-child { margin-top: 0; }
.theme-cellule { display: inline-flex; align-items: center; gap: 0.5rem; }
.theme-cellule :deep(.pastille-theme) { width: 2rem; height: 2rem; border-radius: 10px; }

@media (max-width: 56rem) { .grille-haut { grid-template-columns: minmax(0, 1fr); } }
</style>
