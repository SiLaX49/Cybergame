<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { getLeviers, getMission } from '@/content'
import { FIL_ACTIONS } from '@/content/schema'
import { ordreAffichage } from '@/engine/ordre'
import { CONSEILS, EXEMPLE_PHRASE, LIBELLES_NIVEAU } from '@/minigames/robustesse'

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
const VERDICT_PAPIER = { fiable: 'Fiable', douteux: 'Douteux', faux: 'Faux' } as const
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
            <p v-if="e.ecran.app === 'mail' && e.ecran.sujet">Objet : {{ e.ecran.sujet }}</p>
            <p v-if="e.ecran.app === 'web' && e.ecran.url">Adresse : {{ e.ecran.url }}</p>
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
        <template v-else-if="e.type === 'lieu'">
          <h2>Lieu {{ i + 1 }} : {{ e.lieu }}</h2>
          <div class="carte"><p>{{ e.guide }}</p></div>
          <p><strong>{{ e.question }}</strong></p>
          <ul class="cases"><li v-for="c in ordreAffichage(e.choix, e.id)" :key="c.id">☐ {{ c.texte }}</li></ul>
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
        <template v-else-if="e.type === 'minijeu' && e.jeu === 'repere'">
          <h2>Mini-jeu {{ i + 1 }} : {{ e.config.consigne }}</h2>
          <p>Entoure les lignes suspectes.</p>
          <div class="carte">
            <p><strong>{{ e.config.titre }}</strong></p>
            <p v-for="l in e.config.lignes" :key="l.id">{{ l.texte }}</p>
          </div>
        </template>
        <template v-else-if="e.type === 'minijeu' && e.jeu === 'motdepasse'">
          <h2>Mini-jeu {{ i + 1 }} : {{ e.config.consigne }}</h2>
          <p>{{ e.config.contexte }}</p>
          <p>Écris une phrase de passe (pas ton vrai mot de passe !) : ______________________________</p>
          <ul class="cases"><li v-for="c in CONSEILS" :key="c.id">☐ {{ c.libelle }}</li></ul>
        </template>
        <template v-else-if="e.type === 'minijeu' && e.jeu === 'confidentialite'">
          <h2>Mini-jeu {{ i + 1 }} : {{ e.config.consigne }}</h2>
          <p><strong>Paramètres · {{ e.config.appNom }}</strong></p>
          <div v-for="r in e.config.reglages" :key="r.id">
            <p>{{ r.libelle }}</p>
            <ul class="cases"><li v-for="o in r.options" :key="o.id">☐ {{ o.libelle }}</li></ul>
          </div>
        </template>
        <template v-else-if="e.type === 'minijeu' && e.jeu === 'verification'">
          <h2>Mini-jeu {{ i + 1 }} : {{ e.config.consigne }}</h2>
          <div class="carte">
            <p>
              <strong>{{ e.config.publication.auteur }}</strong>
              <span v-if="e.config.publication.date"> · {{ e.config.publication.date }}</span>
            </p>
            <p>{{ e.config.publication.texte }}</p>
            <p v-if="e.config.publication.image">Image (décrite) : {{ e.config.publication.image.description }}</p>
          </div>
          <p>Pistes d’enquête : {{ e.config.actions.map((a) => a.libelle).join(' · ') }}</p>
          <p>Ton verdict : ☐ Fiable ☐ Douteux ☐ Faux</p>
        </template>
        <template v-else-if="e.type === 'minijeu' && e.jeu === 'permissions'">
          <h2>Mini-jeu {{ i + 1 }} : {{ e.config.consigne }}</h2>
          <table v-for="a in e.config.apps" :key="a.id">
            <caption>{{ a.nom }} : {{ a.description }}</caption>
            <thead><tr><th scope="col">Permission</th><th scope="col">Autoriser</th><th scope="col">Refuser</th></tr></thead>
            <tbody><tr v-for="p in a.permissions" :key="p.id"><td>{{ p.libelle }}</td><td>☐</td><td>☐</td></tr></tbody>
          </table>
        </template>
        <template v-else-if="e.type === 'fil'">
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
          <template v-else-if="e.type === 'lieu'">
            <h3>Lieu {{ i + 1 }} : {{ e.lieu }}</h3>
            <p>Bons choix : {{ e.choix.filter((c) => c.qualite !== 'risque').map((c) => c.texte).join(' / ') }}</p>
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
          <template v-else-if="e.type === 'minijeu' && e.jeu === 'repere'">
            <h3>Mini-jeu {{ i + 1 }}</h3>
            <ul><li v-for="l in e.config.lignes.filter((x) => x.indice)" :key="l.id">{{ l.texte }} : {{ l.explication }}</li></ul>
          </template>
          <template v-else-if="e.type === 'minijeu' && e.jeu === 'motdepasse'">
            <h3>Mini-jeu {{ i + 1 }}</h3>
            <p>Objectif : {{ LIBELLES_NIVEAU[e.config.objectif].toLowerCase() }}. Exemple : {{ EXEMPLE_PHRASE }} (ne la réutilise pas : elle est publique).</p>
            <p v-if="e.config.interdits.length">À éviter : {{ e.config.interdits.join(', ') }}.</p>
          </template>
          <template v-else-if="e.type === 'minijeu' && e.jeu === 'confidentialite'">
            <h3>Mini-jeu {{ i + 1 }}</h3>
            <ul>
              <li v-for="r in e.config.reglages" :key="r.id">
                {{ r.libelle }} → {{ r.options.find((o) => o.id === r.conseille)?.libelle }} ({{ r.explication }})
              </li>
            </ul>
          </template>
          <template v-else-if="e.type === 'minijeu' && e.jeu === 'verification'">
            <h3>Mini-jeu {{ i + 1 }}</h3>
            <p>Verdict : {{ VERDICT_PAPIER[e.config.verdict] }}. {{ e.config.explication }}</p>
            <ul><li v-for="a in e.config.actions" :key="a.id">{{ a.libelle }} : {{ a.resultat }}</li></ul>
          </template>
          <template v-else-if="e.type === 'minijeu' && e.jeu === 'permissions'">
            <h3>Mini-jeu {{ i + 1 }}</h3>
            <ul>
              <template v-for="a in e.config.apps" :key="a.id">
                <li v-for="p in a.permissions" :key="p.id">
                  {{ a.nom }} · {{ p.libelle }} → {{ p.necessaire ? 'Autoriser' : 'Refuser' }} ({{ p.explication }})
                </li>
              </template>
            </ul>
          </template>
          <template v-else-if="e.type === 'fil'">
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
