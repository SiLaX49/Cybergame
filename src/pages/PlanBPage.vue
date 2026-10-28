<script setup lang="ts">
import { Printer } from '@lucide/vue'
import { RouterLink, useRoute } from 'vue-router'
import { getLeviers, getMission, getTheme } from '@/content'
import { FIL_ACTIONS } from '@/content/schema'
import { ordreAffichage } from '@/engine/ordre'
import { bifurcation, choixDeBifurcation, numerosLieux, routesDe, successeurs } from '@/engine/routes'
import { CONSEILS, EXEMPLE_PHRASE, LIBELLES_NIVEAU } from '@/minigames/robustesse'
import { lignesPapier } from '@/phone/papier'
import BandeauAide from '@/ui/BandeauAide.vue'
import BandeauBrouillon from '@/ui/BandeauBrouillon.vue'

const route = useRoute()
const mission = getMission(String(route.params.id))
const theme = mission?.theme ? getTheme(mission.theme) : undefined
const sensible = theme?.sensible ?? false
const leviers = getLeviers()
// En thème sensible, l’élève n’est pas « piégé » : on parle du choix et de ce qui a pesé.
const questionPourquoi = sensible ? 'Si tu as fait ce choix, qu’est-ce qui a pesé ?' : 'Si tu as choisi le piège, pourquoi ?'
const corrigePourquoi = sensible ? 'Si l’élève a fait le choix risqué :' : 'Si l’élève a choisi le piège :'
const etapes = mission?.etapes ?? []
// Numéros des lieux (1 à n en linéaire ; 3a, 3b… sur un parcours à plusieurs routes) et renvois « livre dont tu es le héros ».
const numeros = numerosLieux(etapes)
const numero = (id: string, i: number) => numeros[id] ?? String(i + 1)
const plusieursRoutes = routesDe(etapes).length > 1
const choixFourche = choixDeBifurcation(etapes)
// Le texte du choix est cité entre guillemets : son point final ferait deux ponctuations de suite.
const sansPoint = (t: string) => t.replace(/[.\s]+$/, '')
function renvoi(id: string): string | null {
  if (!plusieursRoutes) return null
  const fourche = bifurcation(etapes, id)
  if (fourche && choixFourche) {
    const reparation = fourche.reparation && choixFourche.texteReparation ? ` Si tu choisis « ${sansPoint(choixFourche.texteReparation)} », va au lieu ${numeros[fourche.reparation]}.` : ''
    return `Si tu choisis « ${sansPoint(choixFourche.texteBon)} », va au lieu ${numeros[fourche.bon]}. Si tu choisis « ${sansPoint(choixFourche.texteAide)} », va au lieu ${numeros[fourche.aide]}.${reparation} Si tu as coché un autre choix, relis la situation et choisis à nouveau.`
  }
  const suivant = successeurs(etapes, id)[0]
  const enRoute = /[a-z]$/.test(numeros[id] ?? '')
  return suivant && enRoute && !/[a-z]$/.test(numeros[suivant] ?? '') ? `Va au lieu ${numeros[suivant]}.` : null
}
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
      <BandeauBrouillon v-if="mission.relecture?.statut === 'a-relire'" />
      <header class="carte entete-papier">
        <p class="surtitre no-print">Version papier · plan B</p>
        <h1>{{ mission.titre }} : version papier</h1>
        <p class="consigne-papier no-print">
          Pour jouer sans écran : une fiche élève à distribuer, puis le corrigé pour l’adulte, sur une nouvelle page.
        </p>
        <div class="actions no-print">
          <button type="button" class="btn btn-primaire" @click="imprimer"><Printer aria-hidden="true" :size="18" /> Imprimer</button>
          <RouterLink class="btn btn-secondaire" :to="`/enseignants/${mission.id}`">Retour à la fiche</RouterLink>
        </div>
        <p class="identite">Nom : ______________________ Classe : ________</p>
      </header>

      <section v-for="(e, i) in mission.etapes" :key="e.id" class="etape-papier carte">
        <template v-if="e.type === 'scenario'">
          <h2>Situation {{ i + 1 }}</h2>
          <div class="message-papier">
            <p v-for="(ligne, j) in lignesPapier(e.ecran)" :key="j">
              <strong v-if="j === 0">{{ ligne }}</strong>
              <template v-else>{{ ligne }}</template>
            </p>
          </div>
          <p class="question-papier">{{ e.question }}</p>
          <ul class="cases"><li v-for="c in ordreAffichage(e.choix, e.id)" :key="c.id">☐ {{ c.texte }}</li></ul>
          <p>{{ e.fiable ? 'Souligne dans le message ce qui montre qu’il est fiable.' : 'Souligne dans le message ce qui devait t’alerter.' }}</p>
          <template v-if="e.pourquoi">
            <p>{{ questionPourquoi }}</p>
            <ul class="cases">
              <li v-for="p in ordreAffichage(e.pourquoi.map((x) => ({ id: x.levier })), `${e.id}:pourquoi`)" :key="p.id">
                ☐ {{ leviers.leviers[p.id].libelle }}
              </li>
              <li>☐ {{ leviers.autre.libelle }}</li>
            </ul>
          </template>
        </template>
        <template v-else-if="e.type === 'lieu'">
          <h2>Lieu {{ numero(e.id, i) }} : {{ e.lieu }}</h2>
          <div class="message-papier"><p>{{ e.guide }}</p></div>
          <p class="question-papier">{{ e.question }}</p>
          <ul class="cases"><li v-for="c in ordreAffichage(e.choix, e.id)" :key="c.id">☐ {{ c.texte }}</li></ul>
          <template v-if="e.pourquoi">
            <p>{{ questionPourquoi }}</p>
            <ul class="cases">
              <li v-for="p in ordreAffichage(e.pourquoi.map((x) => ({ id: x.levier })), `${e.id}:pourquoi`)" :key="p.id">
                ☐ {{ leviers.leviers[p.id].libelle }}
              </li>
              <li>☐ {{ leviers.autre.libelle }}</li>
            </ul>
          </template>
          <p v-if="renvoi(e.id)" class="renvoi"><strong>{{ renvoi(e.id) }}</strong></p>
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
          <div class="message-papier">
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
          <div class="message-papier">
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

      <BandeauAide v-if="sensible && theme" :aides="theme.aides" class="bandeau-imprimable" />

      <section class="corrige saut-page carte" aria-labelledby="titre-corrige">
        <p class="surtitre no-print">Ne pas distribuer aux élèves</p>
        <h2 id="titre-corrige">Corrigé (pour l’adulte)</h2>
        <div v-for="(e, i) in mission.etapes" :key="e.id">
          <template v-if="e.type === 'scenario'">
            <h3>Situation {{ i + 1 }}</h3>
            <p>Bons choix : {{ e.choix.filter((c) => c.qualite !== 'risque').map((c) => c.texte).join(' / ') }}</p>
            <p>
              {{ e.fiable ? 'Message vrai. Indices de confiance :' : 'Vrais indices :' }}
              {{ e.indices.map((x) => (x.passage ? `${x.libelle} (« ${x.passage} »)` : x.libelle)).join(' / ') }}
            </p>
            <p>À retenir : {{ e.aRetenir }}</p>
            <template v-if="e.pourquoi">
              <p>{{ corrigePourquoi }}</p>
              <ul>
                <li v-for="p in e.pourquoi" :key="p.levier">
                  <strong>{{ leviers.leviers[p.levier].libelle }}</strong> : {{ p.truc }} Parade : {{ p.parade }}
                </li>
              </ul>
            </template>
          </template>
          <template v-else-if="e.type === 'lieu'">
            <h3>Lieu {{ numero(e.id, i) }} : {{ e.lieu }}</h3>
            <p>Bons choix : {{ e.choix.filter((c) => c.qualite !== 'risque').map((c) => c.texte).join(' / ') }}</p>
            <p>À retenir : {{ e.aRetenir }}</p>
            <template v-if="e.pourquoi">
              <p>{{ corrigePourquoi }}</p>
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
.plan-b { display: grid; gap: 1.5rem; padding-block: 2.5rem; max-width: 60rem; }
.plan-b :deep(.bandeau-brouillon) { margin: 0; }

.entete-papier { background: linear-gradient(to bottom right, var(--surface), var(--surface-2)); }
.entete-papier h1 { margin: 0; }
.consigne-papier { margin: 0.5rem 0 0; color: var(--texte-doux); }
.identite { margin: 1.25rem 0 0; padding-top: 1rem; border-top: 1px solid var(--bord); font-weight: 600; }

.etape-papier > :first-child, .corrige > :first-child { margin-top: 0; }
.etape-papier > :last-child, .corrige > :last-child { margin-bottom: 0; }
.etape-papier h2, .corrige h2 { font-size: 1.15em; }
.message-papier {
  margin: 0.75rem 0 1rem; padding: 0.9rem 1.1rem;
  background: var(--surface-2); border: 1px solid var(--bord); border-radius: 14px;
}
.message-papier > :first-child { margin-top: 0; }
.message-papier > :last-child { margin-bottom: 0; }
.question-papier { font-weight: 600; }
.cases { list-style: none; margin: 0.5rem 0 1rem; padding: 0; display: grid; gap: 0.35rem; }
.cases li { padding: 0.45rem 0.75rem; border: 1px solid var(--bord); border-radius: 10px; }
.renvoi { padding: 0.75rem 1rem; border-left: 4px solid var(--primaire); background: var(--surface-2); border-radius: 0 10px 10px 0; }

table { width: 100%; border-collapse: collapse; margin: 0.75rem 0 0; font-size: 0.95em; }
th, td { border-bottom: 1px solid var(--bord); padding: 0.55rem 0.6rem; text-align: left; }
thead th {
  background: var(--surface-2); color: var(--texte-doux);
  font-size: 0.8em; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
}
caption { text-align: left; font-weight: 600; padding-bottom: 0.4rem; }

.corrige { border-top: 4px solid var(--primaire); }
.corrige h3 { margin: 1.5rem 0 0.5rem; padding-top: 1rem; border-top: 1px solid var(--bord); font-size: 1em; }
.corrige > div:first-of-type h3 { border-top: 0; padding-top: 0; }

/* Papier : pas de cases encadrées ni de fonds (print.css passe les jetons en noir sur blanc). */
@media print {
  .plan-b { display: block; padding: 0; max-width: none; }
  .etape-papier, .corrige, .entete-papier { margin-bottom: 1rem; padding: 0.75rem 1rem; }
  .cases li { border: 0; padding: 0.15rem 0; }
  .message-papier, .renvoi { background: var(--surface); }
  thead th { background: var(--surface); color: var(--texte); }
  th, td { border: 1px solid var(--bord); }
}
/* Les aides restent à leur place en fin de fiche élève, à l’écran comme à l’impression. */
.bandeau-imprimable { position: static; }
@media print { .bandeau-imprimable { display: block !important; } }
</style>
