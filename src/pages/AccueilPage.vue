<script setup lang="ts">
import { Check } from '@lucide/vue'
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { TRANCHES, TRANCHE_LIBELLES } from '@/content/schema'
import { dateDuJour, solde } from '@/engine/portefeuille'
import ObjectifsJour from '@/profil/ObjectifsJour.vue'
import { classementIles, defiPour, ileEnCours } from '@/profil/tableau'
import { MODES, type Mode } from '@/store/progress'
import { useProgress } from '@/store/useProgress'
import AgenteCyber from '@/ui/AgenteCyber.vue'
import Octets from '@/ui/Octets.vue'

const store = useProgress()
const router = useRouter()

const MODE_INFOS: Record<Mode, { titre: string; description: string }> = {
  solo: { titre: 'Solo', description: 'Je joue seul·e, à mon rythme.' },
  binome: { titre: 'Binôme', description: 'On joue à deux sur le même écran et on discute avant chaque choix.' },
  classe: { titre: 'Classe entière', description: 'Le jeu est projeté, la classe vote, l’adulte valide.' },
}

/** Dessins des tuiles de mission, par île (décor seulement). */
const ILLUSTRATIONS: Record<string, string[]> = {
  phishing: ['📩', '🎣', '🔍'],
  comptes: ['🔐', '🔑', '🛡️'],
  'vie-privee': ['🕶️', '📸', '🙈'],
  'jeux-achats': ['🎮', '🛒', '💳'],
  desinformation: ['📰', '🔍', '🧐'],
  appareils: ['📡', '📱', '🔧'],
}

const aDejaJoue = computed(() => Object.keys(store.etat.missions).length > 0)
const pret = computed(() => store.etat.tranche !== null && store.etat.mode !== null)
/** Le formulaire de départ : affiché tant que niveau et mode ne sont pas validés, rouvert par « Changer ». */
const formulaire = ref(!pret.value)

const aujourdhui = dateDuJour()
const ile = computed(() => (store.etat.tranche ? ileEnCours(store.etat.tranche, store.etat.missions) : null))
const pourcentage = computed(() => (ile.value && ile.value.total ? Math.round((ile.value.terminees / ile.value.total) * 100) : 0))
const illustration = (i: number) => ILLUSTRATIONS[ile.value?.theme ?? '']?.[i % 3] ?? '🛡️'
const defi = computed(() => (store.etat.tranche ? defiPour(store.etat.tranche, aujourdhui) : undefined))
/** Trois tuiles : les missions de l’île, complétées au besoin par le défi du jour. */
const tuiles = computed(() => {
  const liste = (ile.value?.missions.slice(0, 3) ?? []).map((m) => ({ mission: m, defi: false }))
  const d = defi.value
  if (liste.length < 3 && d && !liste.some((t) => t.mission.id === d.id)) liste.push({ mission: d, defi: true })
  return liste
})
const classement = computed(() => (store.etat.tranche ? classementIles(store.etat.tranche, store.etat.octets) : []))
/** La prochaine mission à jouer sur l’île (la première pas encore terminée). */
const prochaine = computed(() => ile.value?.missions.find((m) => !(m.id in store.etat.missions)) ?? ile.value?.missions[0])
const reserve = computed(() => solde(store.etat))

function commencer() {
  if (!pret.value) return
  void router.push({ name: 'carte' })
}
</script>

<template>
  <main v-if="formulaire || !pret" class="conteneur accueil-depart">
    <div class="depart-agente"><AgenteCyber :personnage="store.etat.personnage" :hauteur="300" /></div>
    <div class="depart-contenu carte">
      <div class="heros">
        <h1>Cyber Réflexes</h1>
        <p class="accroche">
          Des situations du quotidien pour apprendre les bons réflexes sur Internet. Pas de compte, rien à
          installer. Gagne des octets à chaque bon réflexe… et à chaque erreur réparée !
        </p>
      </div>
      <form @submit.prevent="commencer">
        <fieldset>
          <legend>Je suis en…</legend>
          <div class="choix-grille">
            <label v-for="t in TRANCHES" :key="t" class="option">
              <input
                type="radio"
                name="tranche"
                :value="t"
                :checked="store.etat.tranche === t"
                @change="store.choisirTranche(t)"
              />
              {{ TRANCHE_LIBELLES[t] }}
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Comment on joue ?</legend>
          <div class="choix-grille">
            <label v-for="m in MODES" :key="m" class="option">
              <input
                type="radio"
                name="mode"
                :value="m"
                :checked="store.etat.mode === m"
                @change="store.choisirMode(m)"
              />
              <span>
                <strong>{{ MODE_INFOS[m].titre }}</strong>
                <span class="description"> : {{ MODE_INFOS[m].description }}</span>
              </span>
            </label>
          </div>
        </fieldset>
        <button type="submit" class="btn btn-appel cta" :disabled="!pret">
          {{ aDejaJoue ? 'Continuer' : 'C’est parti' }}
        </button>
      </form>
    </div>
  </main>

  <main v-else class="tableau">
    <div class="tableau-principal">
      <section class="carte parcours" aria-labelledby="titre-module">
        <span class="parcours-numero" aria-hidden="true">{{ ile ? Math.min(ile.terminees + 1, ile.total) : 1 }}</span>
        <div class="parcours-corps">
          <p class="surtitre">Aujourd’hui sur ton parcours</p>
          <template v-if="ile">
            <h1 id="titre-module">{{ ile.nom }} : {{ ile.titre }}</h1>
            <p class="parcours-sous-titre">{{ ile.terminees }} mission{{ ile.terminees > 1 ? 's' : '' }} terminée{{ ile.terminees > 1 ? 's' : '' }} sur {{ ile.total }}</p>
            <div class="progression">
              <progress class="barre-degrade" :value="ile.terminees" :max="ile.total" aria-labelledby="titre-module" />
              <span class="pourcentage">{{ pourcentage }} %</span>
            </div>
            <p v-if="prochaine" class="parcours-suite">Prochaine mission : <strong>{{ prochaine.titre }}</strong></p>
            <div class="actions">
              <RouterLink v-if="prochaine" class="btn btn-primaire" :to="`/mission/${prochaine.id}`">Commencer la mission</RouterLink>
              <RouterLink class="btn btn-secondaire" :to="{ name: 'ile', params: { theme: ile.theme } }">Toutes les missions de l’île</RouterLink>
            </div>
          </template>
          <template v-else>
            <h1 id="titre-module">Bienvenue, agent·e !</h1>
            <p>Choisis une île pour commencer.</p>
            <div class="actions"><RouterLink class="btn btn-primaire" to="/carte">Voir les îles</RouterLink></div>
          </template>
          <p class="parcours-pied">
            <span>{{ TRANCHE_LIBELLES[store.etat.tranche!] }} · {{ MODE_INFOS[store.etat.mode!].titre }}</span>
            <button type="button" class="btn btn-discret changer" @click="formulaire = true">Changer</button>
          </p>
        </div>
      </section>

      <section v-if="ile" class="carte" aria-labelledby="titre-missions">
        <h2 id="titre-missions" class="carte-titre">Les missions de l’île</h2>
        <p class="carte-sous-titre">Choisis par où commencer : chaque mission rapporte des octets.</p>
        <ul class="grille-tuiles">
          <li v-for="({ mission: m, defi: estDefi }, i) in tuiles" :key="m.id">
            <RouterLink class="tuile-mission" :to="`/mission/${m.id}`">
              <span class="tuile-illustration" aria-hidden="true">{{ estDefi ? '🎯' : illustration(i) }}</span>
              <span><template v-if="estDefi">Défi du jour : </template>{{ m.titre }}</span>
              <span v-if="m.id in store.etat.missions" class="tuile-faite"><Check aria-hidden="true" :size="18" /> Terminée</span>
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>

    <aside class="tableau-cote" aria-label="Ta journée">
      <section class="carte agent" aria-labelledby="titre-agent">
        <p class="surtitre">Ton agent·e</p>
        <h2 id="titre-agent" class="carte-titre">Ta réserve : <Octets :valeur="reserve" /></h2>
        <div class="agent-dessin"><AgenteCyber :personnage="store.etat.personnage" :hauteur="200" /></div>
        <RouterLink v-if="defi" class="btn btn-appel" :to="`/mission/${defi.id}`">Lancer le défi du jour</RouterLink>
        <RouterLink v-else class="btn btn-appel" to="/carte">Voir les îles</RouterLink>
      </section>
      <ObjectifsJour />
      <section v-if="classement.length" class="panneau" aria-labelledby="titre-classement">
        <h2 id="titre-classement">Classement de tes îles</h2>
        <ol class="classement">
          <li v-for="(r, i) in classement.slice(0, 4)" :key="r.theme">
            <span class="rang" aria-hidden="true">{{ i + 1 }}</span>
            <span class="avatar" aria-hidden="true">{{ r.emoji }}</span>
            <span class="nom">{{ r.nom }}</span>
            <Octets :valeur="r.octets" />
          </li>
        </ol>
      </section>
    </aside>
  </main>
</template>

<style scoped>
/* ----- Premier écran : choix du niveau et du mode ----- */
.accueil-depart { display: flex; gap: 2rem; align-items: center; padding-block: 2.5rem; }
.depart-agente { flex: none; }
.depart-contenu { flex: 1 1 0; min-width: 0; }
.heros h1 { margin: 0 0 0.5rem; }
.accroche { color: var(--texte-doux); margin: 0 0 1.5rem; }
.choix-grille {
  display: grid; gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
}
.choix-grille .option { min-height: 64px; margin: 0; }
.description { color: var(--texte-doux); font-weight: 400; }

/* ----- Tableau de bord : colonne principale | colonne « Ta journée » ----- */
.tableau {
  display: grid; gap: 1.5rem; align-items: start;
  grid-template-columns: minmax(0, 2fr) minmax(16rem, 1fr);
  max-width: 90rem; margin: 0 auto; padding: 2.5rem 1.5rem;
}
.tableau-principal, .tableau-cote { display: grid; gap: 1.5rem; min-width: 0; }
.carte-titre { margin: 0; font-size: 1.15em; }
.carte-sous-titre { margin: 0.2rem 0 1.25rem; color: var(--texte-doux); font-size: 0.9em; }

.parcours {
  display: flex; gap: 1.5rem; align-items: flex-start;
  background: linear-gradient(to bottom right, var(--surface), var(--surface-2));
}
.parcours-numero {
  flex: none; display: grid; place-items: center; width: 4rem; height: 4rem; border-radius: 50%;
  border: 4px solid var(--primaire); background: var(--surface);
  font-family: var(--police-titres); font-weight: 700; font-size: 1.5em; color: var(--texte);
}
.parcours-corps { flex: 1; min-width: 0; }
.parcours h1 { margin: 0; font-size: clamp(1.25em, 1.1em + 0.6vw, 1.5em); }
.parcours-sous-titre { margin: 0.2rem 0 0.75rem; color: var(--texte-doux); }
.progression { display: flex; align-items: center; gap: 1rem; }
.pourcentage { font-weight: 600; color: var(--texte-doux); white-space: nowrap; font-size: 0.9em; }
.parcours-suite {
  margin: 1rem 0 0; padding: 0.7rem 1rem; border-radius: 12px;
  background: var(--surface-2); border: 1px solid var(--bord);
}
.parcours-pied {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem;
  margin: 1.25rem 0 0; padding-top: 0.75rem; border-top: 1px solid var(--bord); color: var(--texte-doux);
}
.changer { min-height: 44px; padding-inline: 0.4rem; }

.grille-tuiles {
  list-style: none; padding: 0; margin: 0;
  display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
}
.grille-tuiles li { display: grid; }
.grille-tuiles li:nth-child(2) .tuile-mission { --tuile-fond: var(--tuile-b); }
.grille-tuiles li:nth-child(3) .tuile-mission { --tuile-fond: var(--tuile-c); }
.tuile-faite { display: inline-flex; align-items: center; gap: 0.3em; font-size: 0.85em; font-family: var(--police-texte); }

.agent { display: grid; gap: 0.5rem; justify-items: start; }
.agent .surtitre { margin: 0; }
.agent-dessin { justify-self: center; }
.agent .btn-appel { justify-self: stretch; }

.classement { list-style: none; padding: 0.25rem 0; margin: 0; display: grid; }
.classement li {
  display: grid; grid-template-columns: 1.6rem 2.2rem minmax(0, 1fr) auto; align-items: center; gap: 0.6rem;
  padding: 0.55rem 0; border-bottom: 1px solid var(--bord);
}
.classement li:last-child { border-bottom: 0; }
.classement .octets { font-size: 0.85em; white-space: nowrap; }
.rang { font-weight: 700; color: var(--texte-doux); font-size: 0.9em; }
.classement li:first-child .rang { color: var(--or); }
.avatar {
  display: grid; place-items: center; width: 2.2rem; height: 2.2rem; border-radius: 50%;
  background: var(--surface-2); border: 2px solid var(--bord); font-size: 1.1rem;
}
.nom { font-weight: 600; min-width: 0; overflow-wrap: anywhere; font-size: 0.95em; }

@media (max-width: 62rem) {
  .tableau { grid-template-columns: minmax(0, 1fr); padding: 1.5rem 1rem; }
}
@media (max-width: 44rem) {
  .parcours { flex-direction: column; gap: 1rem; }
  .depart-agente { display: none; }
}
</style>
