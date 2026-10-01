<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { getLeviers, getMission } from '@/content'
import { FIL_ACTIONS } from '@/content/schema'
import { ordreAffichage } from '@/engine/ordre'

const route = useRoute()
const mission = getMission(String(route.params.id))
const leviers = getLeviers()
const imprimer = () => window.print()
const ACTIONS_PAPIER: Record<(typeof FIL_ACTIONS)[number], string> = {
  ouvrir: 'J’ouvre',
  verifier: 'Je vérifie',
  signaler: 'Je signale',
  ignorer: 'J’ignore',
}
</script>

<template>
  <main class="conteneur plan-b">
    <template v-if="!mission">
      <h1>Cette mission n’existe plus</h1>
      <RouterLink class="btn" to="/enseignants">Retour à l’espace enseignants</RouterLink>
    </template>
    <template v-else>
      <div class="actions no-print">
        <button type="button" class="btn btn-primaire" @click="imprimer">Imprimer</button>
        <RouterLink class="btn" :to="`/enseignants/${mission.id}`">Retour à la fiche</RouterLink>
      </div>
      <h1>{{ mission.titre }} : version papier</h1>
      <p>Nom : ______________________ Classe : ________</p>

      <section v-for="(e, i) in mission.etapes" :key="e.id" class="etape-papier">
        <template v-if="e.type === 'scenario'">
          <h2>Situation {{ i + 1 }}</h2>
          <div class="carte">
            <p><strong>{{ e.ecran.appNom }} · {{ e.ecran.contact }}</strong></p>
            <p v-if="e.ecran.sujet">Objet : {{ e.ecran.sujet }}</p>
            <p v-if="e.ecran.url">Adresse : {{ e.ecran.url }}</p>
            <p v-for="(m, j) in e.ecran.messages" :key="j">{{ m.de === 'moi' ? 'Moi' : e.ecran.contact }} : {{ m.texte }}</p>
          </div>
          <p><strong>{{ e.question }}</strong></p>
          <ul class="cases"><li v-for="c in ordreAffichage(e.choix, e.id)" :key="c.id">☐ {{ c.texte }}</li></ul>
          <p>Quel indice t’a décidé ?</p>
          <ul class="cases"><li v-for="ind in ordreAffichage(e.indices, e.id)" :key="ind.id">☐ {{ ind.libelle }}</li></ul>
          <template v-if="e.pourquoi">
            <p>Si tu as choisi le piège, pourquoi ?</p>
            <ul class="cases">
              <li v-for="p in ordreAffichage(e.pourquoi.map((x) => ({ id: x.levier })), `${e.id}:pourquoi`)" :key="p.id">
                ☐ {{ leviers.leviers[p.id].libelle }}
              </li>
              <li>☐ {{ leviers.autre.libelle }}</li>
            </ul>
          </template>
        </template>
        <template v-else-if="e.type === 'minijeu' && e.jeu === 'tri'">
          <h2>Mini-jeu {{ i + 1 }} : {{ e.config.consigne }}</h2>
          <table>
            <thead><tr><th scope="col">Message</th><th v-for="c in e.config.categories" :key="c.id" scope="col">{{ c.libelle }}</th></tr></thead>
            <tbody>
              <tr v-for="carte in e.config.cartes" :key="carte.id">
                <td>{{ carte.texte }}</td>
                <td v-for="c in e.config.categories" :key="c.id">☐</td>
              </tr>
            </tbody>
          </table>
        </template>
        <template v-else-if="e.type === 'minijeu'">
          <h2>Mini-jeu {{ i + 1 }} : {{ e.config.consigne }}</h2>
          <p>Entoure les lignes suspectes.</p>
          <div class="carte">
            <p><strong>{{ e.config.titre }}</strong></p>
            <p v-for="l in e.config.lignes" :key="l.id">{{ l.texte }}</p>
          </div>
        </template>
        <template v-else>
          <h2>Notifications {{ i + 1 }} : {{ e.consigne }}</h2>
          <table>
            <thead><tr><th scope="col">Notification</th><th v-for="a in FIL_ACTIONS" :key="a" scope="col">{{ ACTIONS_PAPIER[a] }}</th></tr></thead>
            <tbody>
              <tr v-for="n in e.notifications" :key="n.id">
                <td>{{ n.appNom }} · {{ n.de }} : {{ n.texte }}</td>
                <td v-for="a in FIL_ACTIONS" :key="a">☐</td>
              </tr>
            </tbody>
          </table>
        </template>
      </section>

      <section class="corrige saut-page">
        <h2>Corrigé (pour l’adulte)</h2>
        <div v-for="(e, i) in mission.etapes" :key="e.id">
          <template v-if="e.type === 'scenario'">
            <h3>Situation {{ i + 1 }}</h3>
            <p>Bons choix : {{ e.choix.filter((c) => c.qualite !== 'risque').map((c) => c.texte).join(' / ') }}</p>
            <p>Vrais indices : {{ e.indices.filter((x) => x.pertinent).map((x) => x.libelle).join(' / ') }}</p>
            <p>À retenir : {{ e.aRetenir }}</p>
            <template v-if="e.pourquoi">
              <p>Si l’élève a choisi le piège :</p>
              <ul>
                <li v-for="p in e.pourquoi" :key="p.levier">
                  <strong>{{ leviers.leviers[p.levier].libelle }}</strong> : {{ p.truc }} Parade : {{ p.parade }}
                </li>
              </ul>
            </template>
          </template>
          <template v-else-if="e.type === 'minijeu' && e.jeu === 'tri'">
            <h3>Mini-jeu {{ i + 1 }}</h3>
            <ul>
              <li v-for="carte in e.config.cartes" :key="carte.id">
                {{ carte.texte }} → {{ e.config.categories.find((c) => c.id === carte.categorie)?.libelle }} ({{ carte.explication }})
              </li>
            </ul>
          </template>
          <template v-else-if="e.type === 'minijeu'">
            <h3>Mini-jeu {{ i + 1 }}</h3>
            <ul><li v-for="l in e.config.lignes.filter((x) => x.indice)" :key="l.id">{{ l.texte }} : {{ l.explication }}</li></ul>
          </template>
          <template v-else>
            <h3>Notifications {{ i + 1 }}</h3>
            <ul>
              <li v-for="n in e.notifications" :key="n.id">
                {{ n.de }} : {{ n.explication }}<strong v-if="n.surprise"> (message piège)</strong>
              </li>
            </ul>
          </template>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
table { width: 100%; border-collapse: collapse; margin: 0.5rem 0 1rem; }
th, td { border: 1px solid var(--bord); padding: 0.4rem; text-align: left; }
.cases { list-style: none; padding-left: 0.5rem; }
</style>
