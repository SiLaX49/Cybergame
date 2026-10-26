<script setup lang="ts">
import { Check } from '@lucide/vue'
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { TRANCHES, TRANCHE_LIBELLES } from '@/content/schema'
import { dateDuJour } from '@/engine/portefeuille'
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

function commencer() {
  if (!pret.value) return
  void router.push({ name: 'carte' })
}
</script>

<template>
  <main v-if="formulaire || !pret" class="conteneur accueil-depart">
    <div class="depart-agente"><AgenteCyber :personnage="store.etat.personnage" :hauteur="300" /></div>
    <div class="depart-contenu">
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
    <div class="tableau-agente"><AgenteCyber :personnage="store.etat.personnage" :hauteur="460" /></div>

    <section class="tableau-centre" aria-labelledby="titre-module">
      <p class="niveau">
        {{ TRANCHE_LIBELLES[store.etat.tranche!] }} · {{ MODE_INFOS[store.etat.mode!].titre }} ·
        <button type="button" class="btn btn-discret changer" @click="formulaire = true">Changer</button>
      </p>
      <template v-if="ile">
        <h1 id="titre-module">{{ ile.nom }} : {{ ile.titre }}</h1>
        <div class="progression">
          <progress class="barre-degrade" :value="ile.terminees" :max="ile.total" aria-labelledby="titre-module" />
          <span class="pourcentage">{{ pourcentage }} %</span>
        </div>
        <ul class="grille-tuiles">
          <li v-for="({ mission: m, defi: estDefi }, i) in tuiles" :key="m.id" :class="{ 'tuile-grande': i === 0 }">
            <RouterLink class="tuile-mission" :to="`/mission/${m.id}`">
              <span class="tuile-illustration" aria-hidden="true">{{ estDefi ? '🎯' : illustration(i) }}</span>
              <span><template v-if="estDefi">Défi du jour : </template>{{ m.titre }}</span>
              <span v-if="m.id in store.etat.missions" class="tuile-faite"><Check aria-hidden="true" :size="18" /> Terminée</span>
            </RouterLink>
          </li>
        </ul>
        <RouterLink class="lien-ile" :to="{ name: 'ile', params: { theme: ile.theme } }">Toutes les missions de l’île</RouterLink>
      </template>
      <template v-else>
        <h1 id="titre-module">Bienvenue, agent·e !</h1>
        <p>Choisis une île pour commencer.</p>
      </template>
      <div class="appel">
        <RouterLink v-if="defi" class="btn btn-appel" :to="`/mission/${defi.id}`">Lancer le défi du jour</RouterLink>
        <RouterLink v-else class="btn btn-appel" to="/carte">Voir les îles</RouterLink>
      </div>
    </section>

    <aside class="tableau-cote" aria-label="Ta journée">
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
.accueil-depart { display: flex; gap: 2rem; align-items: flex-start; }
.depart-agente { flex: none; padding-top: 1rem; }
.depart-contenu { flex: 1 1 0; min-width: 0; }
.heros h1 { margin: 1rem 0 0.25rem; text-transform: uppercase; letter-spacing: 0.03em; }
.accroche { font-size: 1.1em; color: var(--texte-doux); margin: 0 0 1.25rem; }
.choix-grille {
  display: grid; gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
}
.choix-grille .option { min-height: 64px; margin: 0; font-family: var(--police-titres); font-weight: 600; }
.description { color: var(--texte-doux); font-family: var(--police-texte); font-weight: 400; }

/* ----- Tableau de bord : agent·e | module | objectifs et classement ----- */
.tableau {
  display: grid; gap: 1.5rem; align-items: start;
  grid-template-columns: minmax(12rem, 18rem) minmax(0, 1fr) minmax(14rem, 17rem);
  max-width: 78rem; margin: 0 auto; padding: 1.5rem 1rem;
}
.tableau-agente { align-self: end; }
.niveau { margin: 0 0 0.5rem; color: var(--texte-doux); display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem; }
.changer { min-height: 44px; padding-inline: 0.4rem; }
.tableau-centre h1 { margin: 0 0 0.75rem; font-size: clamp(1.4em, 1.2em + 1vw, 1.9em); }
.progression { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; }
.progression progress { height: 0.9rem; }
.pourcentage { font-family: var(--police-titres); font-weight: 700; color: var(--texte-doux); white-space: nowrap; }
.grille-tuiles {
  list-style: none; padding: 0; margin: 0;
  display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr));
}
.grille-tuiles li { display: grid; }
.grille-tuiles li.tuile-grande { grid-row: span 2; }
.tuile-grande .tuile-mission { min-height: 19rem; }
.tuile-grande .tuile-illustration { font-size: 5rem; align-self: center; margin-block: auto; }
.grille-tuiles li:nth-child(2) .tuile-mission { --tuile-fond: var(--tuile-b); }
.grille-tuiles li:nth-child(3) .tuile-mission { --tuile-fond: var(--tuile-c); }
.tuile-faite { display: inline-flex; align-items: center; gap: 0.3em; font-size: 0.85em; font-family: var(--police-texte); }
.lien-ile { display: inline-flex; align-items: center; min-height: 44px; margin-top: 0.5rem; }
.appel { display: flex; justify-content: center; margin-top: 1rem; }
.tableau-cote { display: grid; gap: 1.25rem; }
.classement { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.6rem; }
.classement li { display: grid; grid-template-columns: 1.4rem 2.2rem minmax(0, 1fr); align-items: center; gap: 0.25rem 0.5rem; }
.classement .octets { grid-column: 3; font-size: 0.9em; }
.rang { font-family: var(--police-titres); font-weight: 700; }
.classement li:first-child .rang { color: var(--or); }
.avatar {
  display: grid; place-items: center; width: 2.2rem; height: 2.2rem; border-radius: 50%;
  background: var(--surface-2); border: 2px solid var(--bord-fort); font-size: 1.1rem;
}
.nom { font-weight: 700; min-width: 0; overflow-wrap: anywhere; }

@media (max-width: 62rem) {
  .tableau { grid-template-columns: minmax(0, 1fr) minmax(14rem, 17rem); }
  .tableau-agente { display: none; }
}
@media (max-width: 44rem) {
  .tableau { grid-template-columns: minmax(0, 1fr); }
  .grille-tuiles { grid-template-columns: minmax(0, 1fr); }
  .grille-tuiles li.tuile-grande { grid-row: auto; }
  .tuile-grande .tuile-mission { min-height: 11rem; }
  .depart-agente { display: none; }
}
</style>
