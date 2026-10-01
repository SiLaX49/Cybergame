<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { getLeviers, getMission, getTheme } from '@/content'
import { TRANCHE_LIBELLES } from '@/content/schema'
import BandeauAide from '@/ui/BandeauAide.vue'

const route = useRoute()
const mission = getMission(String(route.params.id))
const theme = mission?.theme ? getTheme(mission.theme) : undefined
const leviers = getLeviers()
const scenariosAvecLeviers = (mission?.etapes ?? []).flatMap((e, i) =>
  e.type === 'scenario' && e.pourquoi ? [{ id: e.id, numero: i + 1, question: e.question, pourquoi: e.pourquoi }] : [],
)
const imprimer = () => window.print()
</script>

<template>
  <main class="conteneur fiche">
    <template v-if="!mission">
      <h1>Cette mission n’existe plus</h1>
      <RouterLink class="btn" to="/enseignants">Retour à l’espace enseignants</RouterLink>
    </template>
    <template v-else>
      <div class="actions no-print">
        <button type="button" class="btn btn-primaire" @click="imprimer">Imprimer la fiche</button>
        <RouterLink class="btn" :to="`/enseignants/${mission.id}/plan-b`">Version papier (plan B)</RouterLink>
        <RouterLink class="btn" :to="`/mission/${mission.id}`">Lancer la mission</RouterLink>
      </div>
      <h1>{{ mission.titre }}</h1>
      <p>{{ mission.resume }}</p>
      <dl class="meta">
        <dt>Niveaux</dt><dd>{{ mission.tranches.map((t) => TRANCHE_LIBELLES[t]).join(', ') }}</dd>
        <dt>Durée de jeu</dt><dd>{{ mission.duree }} min</dd>
        <dt>Thème</dt><dd>{{ theme?.titre ?? 'Rappel (plusieurs thèmes)' }}</dd>
        <dt>Compétences CRCN</dt><dd>{{ mission.competences.crcn.join(', ') }}</dd>
        <dt v-if="mission.competences.programmes.length">Programmes</dt>
        <dd v-if="mission.competences.programmes.length">{{ mission.competences.programmes.join(' ; ') }}</dd>
        <dt>Programme pHARe</dt><dd>{{ mission.competences.phare ? 'Oui, utilisable comme séance pHARe' : 'Non' }}</dd>
      </dl>
      <h2>Objectifs</h2>
      <ol><li v-for="o in mission.objectifs" :key="o">{{ o }}</li></ol>
      <h2>Déroulé suggéré</h2>
      <p class="pre">{{ mission.fiche.deroulement }}</p>
      <h2>Débrief</h2>
      <ol><li v-for="q in mission.debrief.questions" :key="q">{{ q }}</li></ol>
      <h3>Éléments de réponse</h3>
      <p class="pre">{{ mission.debrief.reponses }}</p>
      <h3>Erreurs fréquentes</h3>
      <ul><li v-for="e in mission.debrief.erreursFrequentes" :key="e">{{ e }}</li></ul>
      <template v-if="scenariosAvecLeviers.length">
        <h2>Leviers travaillés</h2>
        <section v-for="s in scenariosAvecLeviers" :key="s.id">
          <h3>Situation {{ s.numero }} : {{ s.question }}</h3>
          <ul>
            <li v-for="p in s.pourquoi" :key="p.levier">
              <strong>{{ leviers.leviers[p.levier].libelle }}</strong> : {{ leviers.leviers[p.levier].questionDebrief }}
            </li>
          </ul>
        </section>
      </template>
      <template v-if="mission.fiche.siRevelation">
        <h2>Si un élève révèle une situation réelle</h2>
        <p class="pre">{{ mission.fiche.siRevelation }}</p>
        <BandeauAide v-if="theme" :aides="theme.aides" class="bandeau-imprimable" />
      </template>
    </template>
  </main>
</template>

<style scoped>
.meta { display: grid; grid-template-columns: max-content 1fr; gap: 0.25rem 1rem; }
.meta dt { font-weight: 700; }
.pre { white-space: pre-line; }
@media print { .bandeau-imprimable { display: block !important; position: static; } }
</style>
