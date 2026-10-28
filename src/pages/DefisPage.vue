<script setup lang="ts">
import { CircleCheck, Clock, RotateCcw } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { nomIle } from '@/archipel/archipel'
import { rappelPour } from '@/content'
import { GAINS } from '@/engine/octets'
import { dateDuJour } from '@/engine/portefeuille'
import ObjectifsJour from '@/profil/ObjectifsJour.vue'
import { defiPour } from '@/profil/tableau'
import { useProgress } from '@/store/useProgress'
import Octets from '@/ui/Octets.vue'

const store = useProgress()
const aujourdhui = dateDuJour()
const defi = computed(() => (store.etat.tranche ? defiPour(store.etat.tranche, aujourdhui) : undefined))
const releve = computed(() => store.etat.defis.includes(aujourdhui))
const rappel = computed(() => (store.etat.tranche ? rappelPour(store.etat.tranche) : undefined))

/** Le barème, affiché tel quel : l’élève voit qu’une erreur réparée rapporte presque autant qu’un bon réflexe. */
const BAREME = [
  { quoi: 'Mission terminée', octets: GAINS.missionTerminee },
  { quoi: 'Bon réflexe du premier coup', octets: GAINS.bonReflexe },
  { quoi: 'Erreur réparée (les bons gestes après un piège)', octets: GAINS.erreurReparee },
  { quoi: 'Route de réparation suivie jusqu’au bout', octets: GAINS.routeReparation },
  { quoi: 'Bon réflexe avec un indice', octets: GAINS.avecIndice },
  { quoi: 'Retenté et trouvé', octets: GAINS.retenteReussie },
  { quoi: 'Message piège déjoué', octets: GAINS.surpriseVerifiee },
  { quoi: 'Réussite dans un mini-jeu (jusqu’à 10 par mini-jeu)', octets: GAINS.parReussiteMinijeu },
  { quoi: 'Défi du jour relevé', octets: GAINS.defiDuJour },
]
</script>


<template>
  <main class="conteneur defis">
    <header class="defis-entete">
      <p class="surtitre">Chaque jour, une nouvelle mission</p>
      <h1>Défis</h1>
      <p class="sous-titre">Relève le défi du jour, révise avec la mission rappel et regarde comment gagner des octets.</p>
    </header>

    <div class="defis-grille">
      <div class="defis-principal">
        <section class="carte defi-jour" aria-labelledby="titre-defi">
          <span class="defi-pastille" aria-hidden="true">🎯</span>
          <div class="defi-corps">
            <h2 id="titre-defi" class="surtitre">Défi du jour</h2>
            <template v-if="defi">
              <p class="defi-titre">{{ defi.titre }}</p>
              <p class="defi-infos">
                <span v-if="defi.theme && nomIle(defi.theme)" class="badge">{{ nomIle(defi.theme) }}</span>
                <span class="badge"><Clock aria-hidden="true" :size="14" /> {{ defi.duree }} min</span>
                <span class="badge badge-or">Bonus <Octets :valeur="GAINS.defiDuJour" signe /></span>
              </p>
              <p class="defi-explication">Le bonus s’ajoute à ce que tu gagnes dans la mission.</p>
              <p v-if="releve" class="badge badge-bon defi-releve"><CircleCheck aria-hidden="true" :size="18" /> Défi relevé aujourd’hui</p>
              <div class="actions">
                <RouterLink class="btn btn-appel" :to="`/mission/${defi.id}`">{{ releve ? 'Rejouer le défi' : 'Lancer le défi du jour' }}</RouterLink>
              </div>
              <p class="defi-pied">Un nouveau défi t’attend chaque jour.</p>
            </template>
            <p v-else>Choisis d’abord ton niveau sur l’accueil pour recevoir un défi.</p>
          </div>
        </section>

        <section class="carte" aria-labelledby="titre-bareme">
          <h2 id="titre-bareme" class="carte-titre">Comment gagner des octets</h2>
          <p class="carte-sous-titre">Une erreur réparée rapporte presque autant qu’un bon réflexe.</p>
          <table class="bareme">
            <caption class="visually-hidden">Octets gagnés selon ce que tu fais</caption>
            <thead>
              <tr><th scope="col">Ce que tu fais</th><th scope="col">Octets</th></tr>
            </thead>
            <tbody>
              <tr v-for="b in BAREME" :key="b.quoi">
                <th scope="row">{{ b.quoi }}</th>
                <td><Octets :valeur="b.octets" signe /></td>
              </tr>
            </tbody>
          </table>
          <p class="bareme-note">
            Rejouer une mission ne rapporte que ce que tu fais de mieux qu’avant. Les îles calmes (entraide, phare) ne
            comptent pas d’octets : on y vient pour parler, pas pour gagner.
          </p>
        </section>
      </div>

      <aside class="defis-cote" aria-label="Ta journée">
        <section v-if="rappel" class="carte rappel" aria-labelledby="titre-rappel">
          <p class="surtitre">Pour réviser</p>
          <h2 id="titre-rappel" class="carte-titre"><RotateCcw aria-hidden="true" :size="20" /> Mission rappel</h2>
          <p class="carte-sous-titre">5 minutes pour vérifier que les bons réflexes sont restés.</p>
          <RouterLink class="btn btn-secondaire" :to="`/mission/${rappel.id}`">{{ rappel.titre }}</RouterLink>
        </section>
        <ObjectifsJour />
      </aside>
    </div>
  </main>
</template>

<style scoped>
.defis { padding-block: 2.5rem; }
.defis-entete h1 { margin: 0; }
.sous-titre { margin: 0.35rem 0 1.5rem; color: var(--texte-doux); }
.defis-grille { display: grid; gap: 1.5rem; grid-template-columns: minmax(0, 2fr) minmax(16rem, 1fr); align-items: start; }
.defis-principal, .defis-cote { display: grid; gap: 1.5rem; min-width: 0; }
.carte-titre { display: flex; align-items: center; gap: 0.5rem; margin: 0; font-size: 1.15em; }
.carte-sous-titre { margin: 0.2rem 0 1rem; color: var(--texte-doux); font-size: 0.9em; }

.defi-jour { display: flex; gap: 1.5rem; align-items: flex-start; background: linear-gradient(to bottom right, var(--surface), var(--surface-2)); }
.defi-pastille {
  flex: none; display: grid; place-items: center; width: 4rem; height: 4rem; border-radius: 50%;
  border: 4px solid var(--primaire); background: var(--surface); font-size: 1.8rem;
}
.defi-corps { flex: 1; min-width: 0; }
.defi-titre { font-family: var(--police-titres); font-weight: 600; font-size: 1.4em; letter-spacing: -0.02em; margin: 0; }
.defi-infos { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.6rem 0 0; }
.badge-or { background: var(--or-fond); color: var(--texte); border-color: var(--or); }
.defi-explication { margin: 0.75rem 0 0; color: var(--texte-doux); }
.defi-releve { white-space: normal; margin: 0.75rem 0 0; }
.defi-pied { margin: 1.25rem 0 0; padding-top: 0.75rem; border-top: 1px solid var(--bord); color: var(--texte-doux); font-size: 0.9em; }

.bareme { width: 100%; border-collapse: collapse; }
.bareme thead th {
  padding: 0 0 0.5rem; color: var(--texte-doux);
  font-size: 0.75em; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
}
.bareme th, .bareme td { text-align: left; padding: 0.65rem 0; border-bottom: 1px solid var(--bord); }
.bareme tbody tr:last-child > * { border-bottom: 0; }
.bareme tbody th { font-weight: 400; }
.bareme td, .bareme thead th:last-child { white-space: nowrap; text-align: right; }
.bareme-note { margin: 1rem 0 0; padding: 0.85rem 1rem; border-radius: 14px; background: var(--surface-2); font-size: 0.9em; }

.rappel { display: grid; gap: 0.25rem; justify-items: start; }
.rappel .surtitre { margin: 0; }

@media (max-width: 56rem) { .defis-grille { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 36rem) { .defi-jour { flex-direction: column; gap: 1rem; } }
</style>
