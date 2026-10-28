<script setup lang="ts">
import { Clock, FileText, GraduationCap, Play, Printer } from '@lucide/vue'
import { RouterLink, useRoute } from 'vue-router'
import { getLeviers, getMission, getTheme } from '@/content'
import { TRANCHE_LIBELLES } from '@/content/schema'
import { bifurcation, choixDeBifurcation, numerosLieux, routesDe, schemaRoutes } from '@/engine/routes'
import BandeauAide from '@/ui/BandeauAide.vue'
import BandeauBrouillon from '@/ui/BandeauBrouillon.vue'
import PastilleTheme from '@/ui/PastilleTheme.vue'

const route = useRoute()
const mission = getMission(String(route.params.id))
const theme = mission?.theme ? getTheme(mission.theme) : undefined
const leviers = getLeviers()
const numeros = numerosLieux(mission?.etapes ?? [])
const scenariosAvecLeviers = (mission?.etapes ?? []).flatMap((e, i) =>
  (e.type === 'scenario' || e.type === 'lieu') && e.pourquoi
    ? [{ id: e.id, numero: numeros[e.id] ?? String(i + 1), question: e.question, pourquoi: e.pourquoi }]
    : [],
)
const lieux = (mission?.etapes ?? []).flatMap((e) => (e.type === 'lieu' ? [e.lieu] : []))
const nomLieu = (id: string) => {
  const e = mission?.etapes.find((x) => x.id === id)
  return e?.type === 'lieu' ? e.lieu : id
}
// Parcours à deux routes ou plus : le schéma, et pour chaque route le choix de bifurcation et ses lieux propres.
const schema = schemaRoutes(mission?.etapes ?? [])
const choixFourche = choixDeBifurcation(mission?.etapes ?? [])
const routes = (() => {
  const toutes = routesDe(mission?.etapes ?? [])
  if (toutes.length < 2) return []
  // L’étiquette suit la cible du choix « bon » de la bifurcation, pas l’ordre des routes ni des choix dans le fichier.
  const cibles = choixFourche ? bifurcation(mission?.etapes ?? [], choixFourche.id) : null
  return toutes.map((r) => ({
    choix: cibles && r.includes(cibles.bon) ? choixFourche?.bon : cibles?.reparation && r.includes(cibles.reparation) ? choixFourche?.reparation : choixFourche?.aide,
    lieux: r.filter((id) => /[a-z]$/.test(numeros[id] ?? '')).map((id) => `${numeros[id]} ${nomLieu(id)}`),
  }))
})()
const nbRoutes = routesDe(mission?.etapes ?? []).length
const longueurLieux = routesDe(mission?.etapes ?? [])[0]?.length ?? 0
const imprimer = () => window.print()
</script>


<template>
  <main class="conteneur fiche">
    <template v-if="!mission">
      <h1>Cette mission n’existe plus</h1>
      <RouterLink class="btn" to="/enseignants">Retour à l’espace enseignants</RouterLink>
    </template>
    <template v-else>
      <BandeauBrouillon v-if="mission.relecture?.statut === 'a-relire'" />
      <header class="carte entete-fiche">
        <p class="surtitre no-print">Fiche enseignant</p>
        <h1>{{ mission.titre }}</h1>
        <p class="resume">{{ mission.resume }}</p>
        <p class="etiquettes">
          <span class="badge"><GraduationCap aria-hidden="true" :size="14" /> {{ mission.tranches.map((t) => TRANCHE_LIBELLES[t]).join(', ') }}</span>
          <span class="badge"><Clock aria-hidden="true" :size="14" /> {{ mission.duree }} min de jeu</span>
          <span v-if="mission.format === 'parcours'" class="badge">Parcours</span>
          <span v-if="mission.competences.phare" class="badge">Séance pHARe</span>
        </p>
        <div class="actions no-print">
          <button type="button" class="btn btn-primaire" @click="imprimer"><Printer aria-hidden="true" :size="18" /> Imprimer la fiche</button>
          <RouterLink class="btn btn-secondaire" :to="`/enseignants/${mission.id}/plan-b`"><FileText aria-hidden="true" :size="18" /> Version papier (plan B)</RouterLink>
          <RouterLink class="btn btn-secondaire" :to="`/mission/${mission.id}`"><Play aria-hidden="true" :size="18" /> Lancer la mission</RouterLink>
        </div>
      </header>

      <div class="fiche-grille">
        <div class="fiche-principal">
          <section class="carte" aria-labelledby="titre-objectifs">
            <h2 id="titre-objectifs">Objectifs</h2>
            <ol class="numerotee">
              <li v-for="(o, i) in mission.objectifs" :key="o"><span class="numero" aria-hidden="true">{{ i + 1 }}</span><span>{{ o }}</span></li>
            </ol>
          </section>
          <section v-if="schema" class="carte" aria-labelledby="titre-routes">
            <h2 id="titre-routes">{{ nbRoutes > 2 ? 'Les trois routes' : 'Les deux routes' }}</h2>
            <p class="schema">{{ schema }}</p>
            <ul class="routes">
              <li v-for="r in routes" :key="r.choix">Si les élèves choisissent « {{ r.choix }} » : {{ r.lieux.join(', ') }}</li>
            </ul>
            <p v-if="nbRoutes > 2">Les trois routes terminent la mission.</p>
            <p v-else>Les deux routes sont bonnes : toutes deux terminent la mission.</p>
            <p v-if="nbRoutes > 2" class="note">Si l’élève clique « Réessayer » après le choix qui ouvre la route de réparation, ce choix reste grisé : rejouez la mission pour la découvrir.</p>
          </section>
          <section class="carte" aria-labelledby="titre-deroule">
            <h2 id="titre-deroule">Déroulé suggéré</h2>
            <p class="pre">{{ mission.fiche.deroulement }}</p>
          </section>
          <section class="carte" aria-labelledby="titre-debrief">
            <h2 id="titre-debrief">Débrief</h2>
            <ol class="numerotee">
              <li v-for="(q, i) in mission.debrief.questions" :key="q"><span class="numero" aria-hidden="true">{{ i + 1 }}</span><span>{{ q }}</span></li>
              <li v-if="nbRoutes > 2"><span class="numero" aria-hidden="true">{{ mission.debrief.questions.length + 1 }}</span><span>Comparez les trois routes : qu’est-ce qu’on peut encore faire après une erreur ? Qui aide pour quoi ?</span></li>
              <li v-else-if="schema"><span class="numero" aria-hidden="true">{{ mission.debrief.questions.length + 1 }}</span><span>Comparez les deux routes : les deux sont bonnes, qu’est-ce qui change ?</span></li>
            </ol>
            <div class="encadre encadre-info">
              <h3>Éléments de réponse</h3>
              <p class="pre">{{ mission.debrief.reponses }}</p>
            </div>
            <h3>Erreurs fréquentes</h3>
            <ul class="erreurs"><li v-for="e in mission.debrief.erreursFrequentes" :key="e">{{ e }}</li></ul>
          </section>
          <section v-if="scenariosAvecLeviers.length" class="carte" aria-labelledby="titre-leviers">
            <h2 id="titre-leviers">Leviers travaillés</h2>
            <div v-for="s in scenariosAvecLeviers" :key="s.id" class="situation">
              <h3>Situation {{ s.numero }} : {{ s.question }}</h3>
              <ul>
                <li v-for="p in s.pourquoi" :key="p.levier">
                  <strong>{{ leviers.leviers[p.levier].libelle }}</strong> : {{ leviers.leviers[p.levier].questionDebrief }}
                </li>
              </ul>
            </div>
          </section>
          <section v-if="mission.fiche.siRevelation" class="carte" aria-labelledby="titre-revelation">
            <h2 id="titre-revelation">Si un élève révèle une situation réelle</h2>
            <div class="encadre encadre-doux"><p class="pre">{{ mission.fiche.siRevelation }}</p></div>
            <BandeauAide v-if="theme" :aides="theme.aides" class="bandeau-imprimable" />
          </section>
        </div>

        <aside class="fiche-cote" aria-labelledby="titre-en-bref">
          <section class="carte">
            <h2 id="titre-en-bref">En bref</h2>
            <dl class="meta">
              <div><dt>Niveaux</dt><dd>{{ mission.tranches.map((t) => TRANCHE_LIBELLES[t]).join(', ') }}</dd></div>
              <div><dt>Durée de jeu</dt><dd>{{ mission.duree }} min</dd></div>
              <div>
                <dt>Thème</dt>
                <dd class="theme-ligne">
                  <PastilleTheme v-if="theme" :theme="theme" :taille="20" />
                  <span>{{ theme?.titre ?? 'Rappel (plusieurs thèmes)' }}</span>
                </dd>
              </div>
              <div v-if="mission.format === 'parcours'">
                <dt>Format</dt>
                <dd>Parcours de l’île en {{ schema ? `${lieux.length} lieux, ${longueurLieux} par route` : `${lieux.length} lieux` }} : {{ lieux.join(', ') }}</dd>
              </div>
              <div><dt>Compétences CRCN</dt><dd>{{ mission.competences.crcn.join(', ') }}</dd></div>
              <div v-if="mission.competences.programmes.length">
                <dt>Programmes</dt><dd>{{ mission.competences.programmes.join(' ; ') }}</dd>
              </div>
              <div><dt>Programme pHARe</dt><dd>{{ mission.competences.phare ? 'Oui, utilisable comme séance pHARe' : 'Non' }}</dd></div>
            </dl>
          </section>
        </aside>
      </div>
    </template>
  </main>
</template>

<style scoped>
.fiche { display: grid; gap: 1.5rem; padding-block: 2.5rem; }
.fiche :deep(.bandeau-brouillon) { margin: 0; }
.entete-fiche { background: linear-gradient(to bottom right, var(--surface), var(--surface-2)); }
.entete-fiche h1 { margin: 0; }
.resume { margin: 0.5rem 0 0; color: var(--texte-doux); font-size: 1.05em; max-width: 50rem; }
.etiquettes { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 1rem 0 0; }

.fiche-grille { display: grid; gap: 1.5rem; grid-template-columns: minmax(0, 2fr) minmax(16rem, 1fr); align-items: start; }
.fiche-principal, .fiche-cote { display: grid; gap: 1.5rem; min-width: 0; }
.fiche-cote { position: sticky; top: 5rem; }
.carte > h2 { margin: 0 0 0.75rem; font-size: 1.15em; }
.carte > :last-child { margin-bottom: 0; }
.carte h3 { font-size: 1em; margin: 1.25rem 0 0.5rem; }

.numerotee { list-style: none; margin: 0; padding: 0; }
.numerotee li {
  display: grid; grid-template-columns: 2rem minmax(0, 1fr); align-items: start; gap: 0.75rem;
  padding: 0.6rem 0; border-bottom: 1px solid var(--bord);
}
.numerotee li:last-child { border-bottom: 0; }
.numero {
  display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 50%;
  border: 2px solid var(--primaire); font-weight: 700; font-size: 0.85em;
}
.numerotee li > span:last-child { align-self: center; }
.encadre { margin-top: 1rem; }
.encadre h3 { margin-top: 0; }
.erreurs { margin: 0; padding-left: 1.2rem; display: grid; gap: 0.35rem; }
.schema { font-weight: 600; }
.routes { padding-left: 1.2rem; }
.note { color: var(--texte-doux); font-size: 0.9em; }
.situation + .situation { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--bord); }
.situation h3 { margin-top: 0; }

.meta { margin: 0; display: grid; }
.meta > div { padding: 0.6rem 0; border-bottom: 1px solid var(--bord); }
.meta > div:last-child { border-bottom: 0; padding-bottom: 0; }
.meta > div:first-child { padding-top: 0; }
.meta dt { color: var(--texte-doux); font-size: 0.75em; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
.meta dd { margin: 0.15rem 0 0; }
.theme-ligne { display: flex; align-items: center; gap: 0.5rem; }
.pre { white-space: pre-line; }

@media (max-width: 56rem) {
  .fiche-grille { grid-template-columns: minmax(0, 1fr); }
  .fiche-cote { position: static; order: -1; }
}
@media print {
  .fiche, .fiche-principal, .fiche-cote { display: block; padding: 0; }
  /* « En bref » en tête de la feuille, juste sous le titre. */
  .fiche-grille { display: flex; flex-direction: column; align-items: stretch; gap: 0; }
  .fiche-cote { position: static; order: -1; }
  .fiche .carte { margin-bottom: 1rem; padding: 0.75rem 1rem; }
  .bandeau-imprimable { display: block !important; position: static; }
}
</style>
