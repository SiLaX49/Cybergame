<script setup lang="ts">
import { CircleCheck, RotateCcw } from '@lucide/vue'
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
    <h1>Défis</h1>

    <div class="defis-grille">
      <div class="defis-principal">
        <section class="carte defi-jour" aria-labelledby="titre-defi">
          <h2 id="titre-defi">Défi du jour</h2>
          <template v-if="defi">
            <p class="defi-titre">{{ defi.titre }}</p>
            <p v-if="defi.theme && nomIle(defi.theme)" class="defi-ile">{{ nomIle(defi.theme) }} · {{ defi.duree }} min</p>
            <p>Bonus : <Octets :valeur="GAINS.defiDuJour" signe /> en plus de ce que tu gagnes dans la mission.</p>
            <p v-if="releve" class="badge badge-bon defi-releve"><CircleCheck aria-hidden="true" :size="18" /> Défi relevé aujourd’hui</p>
            <RouterLink class="btn btn-appel" :to="`/mission/${defi.id}`">{{ releve ? 'Rejouer le défi' : 'Lancer le défi du jour' }}</RouterLink>
            <p class="discret">Un nouveau défi t’attend chaque jour.</p>
          </template>
          <p v-else>Choisis d’abord ton niveau sur l’accueil pour recevoir un défi.</p>
        </section>

        <section v-if="rappel" class="carte" aria-labelledby="titre-rappel">
          <h2 id="titre-rappel"><RotateCcw aria-hidden="true" /> Mission rappel</h2>
          <p>5 minutes pour vérifier que les bons réflexes sont restés.</p>
          <RouterLink class="btn btn-secondaire" :to="`/mission/${rappel.id}`">{{ rappel.titre }}</RouterLink>
        </section>

        <section class="carte" aria-labelledby="titre-bareme">
          <h2 id="titre-bareme">Comment gagner des octets</h2>
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
          <p>Rejouer une mission ne rapporte que ce que tu fais de mieux qu’avant. Les îles calmes (entraide, phare) ne comptent pas d’octets : on y vient pour parler, pas pour gagner.</p>
        </section>
      </div>

      <aside class="defis-cote" aria-label="Ta journée">
        <ObjectifsJour />
      </aside>
    </div>
  </main>
</template>

<style scoped>
.defis-grille { display: grid; gap: 1.5rem; grid-template-columns: minmax(0, 1fr) minmax(14rem, 18rem); align-items: start; }
.defis-principal { display: grid; gap: 1.25rem; }
.defis-principal h2 { display: flex; align-items: center; gap: 0.5rem; margin-top: 0; }
.defi-jour { border-color: var(--or); }
.defi-titre { font-family: var(--police-titres); font-weight: 700; font-size: 1.4em; margin: 0; }
.defi-ile, .discret { color: var(--texte-doux); }
.defi-releve { white-space: normal; }
.bareme { width: 100%; border-collapse: collapse; }
.bareme th, .bareme td { text-align: left; padding: 0.45rem 0.25rem; border-bottom: 1px solid var(--bord); }
.bareme tbody th { font-weight: 400; }
.bareme td { white-space: nowrap; text-align: right; }
@media (max-width: 50rem) { .defis-grille { grid-template-columns: minmax(0, 1fr); } }
</style>
