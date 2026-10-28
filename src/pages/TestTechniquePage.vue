<script setup lang="ts">
import { CircleCheck, CircleX, Gauge, RotateCw } from '@lucide/vue'
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { toutesLesMissions } from '@/content'
import { stockageSur } from '@/store/progress'
import { verifierPoste } from './testTechnique'

const lancer = () =>
  verifierPoste({
    stockage: stockageSur() !== null,
    serviceWorker: 'serviceWorker' in navigator,
    horsLigneActif: Boolean(navigator.serviceWorker?.controller),
    largeur: window.innerWidth,
    nbMissions: toutesLesMissions().length,
  })
const resultat = ref(lancer())
</script>

<template>
  <main class="conteneur test-technique">
    <header class="carte entete">
      <p class="surtitre"><Gauge aria-hidden="true" :size="14" /> Avant la séance · 30 secondes</p>
      <h1>Test technique du poste</h1>
      <p class="intro">Vérifie que ce poste peut faire tourner le jeu avant de lancer la classe.</p>
      <p role="status" class="verdict" :class="resultat.pret ? 'verdict-pret' : 'verdict-pas-pret'">
        <CircleCheck v-if="resultat.pret" aria-hidden="true" :size="28" class="verdict-icone" />
        <CircleX v-else aria-hidden="true" :size="28" class="verdict-icone" />
        <span v-if="resultat.pret" class="badge badge-bon"><span aria-hidden="true">✅</span> Prêt</span>
        <span v-else class="badge badge-risque"><span aria-hidden="true">❌</span> Pas prêt</span>
        <strong v-if="resultat.pret">Ce poste est prêt pour jouer.</strong>
        <strong v-else>Ce poste n’est pas prêt : voir ci-dessous.</strong>
      </p>
    </header>

    <section class="carte" aria-labelledby="titre-verifs">
      <h2 id="titre-verifs" class="carte-titre">Ce qui a été vérifié</h2>
      <ul class="verifs">
        <li v-for="v in resultat.verifs" :key="v.id" class="verif">
          <span class="verif-texte">
            <strong>{{ v.libelle }}</strong>
            <span v-if="!v.ok" class="verif-detail">{{ v.conseil }}</span>
          </span>
          <span v-if="v.ok" class="badge badge-bon"><span aria-hidden="true">✅</span> OK</span>
          <span v-else-if="v.bloquant" class="badge badge-risque"><span aria-hidden="true">❌</span> À corriger</span>
          <span v-else class="badge badge-aide"><span aria-hidden="true">⚠️</span> À surveiller</span>
        </li>
      </ul>
      <div class="actions">
        <button type="button" class="btn btn-primaire" @click="resultat = lancer()"><RotateCw aria-hidden="true" :size="18" /> Relancer le test</button>
        <RouterLink class="btn btn-secondaire" to="/enseignants">Retour à l’espace enseignants</RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.test-technique { display: grid; gap: 1.5rem; padding-block: 2.5rem; max-width: 52rem; }
.entete { background: linear-gradient(to bottom right, var(--surface), var(--surface-2)); }
.entete .surtitre { display: flex; align-items: center; gap: 0.35rem; }
.entete h1 { margin: 0; }
.intro { margin: 0.35rem 0 0; color: var(--texte-doux); }
.verdict {
  display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.75rem;
  margin: 1.25rem 0 0; padding: 1rem 1.25rem; border-radius: 16px; border: 1px solid;
}
.verdict-pret { background: var(--bon-fond); border-color: var(--bon); }
.verdict-pas-pret { background: var(--risque-fond); border-color: var(--risque); }
.verdict-pret .verdict-icone { color: var(--bon); }
.verdict-pas-pret .verdict-icone { color: var(--risque); }

.carte-titre { margin: 0 0 0.5rem; font-size: 1.15em; }
.verifs { list-style: none; padding: 0; margin: 0; }
.verif {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem 1rem;
  padding: 0.85rem 0; border-bottom: 1px solid var(--bord);
}
.verif:last-child { border-bottom: 0; }
.verif-texte { display: grid; gap: 0.1rem; min-width: 0; flex: 1 1 16rem; }
.verif-detail { color: var(--texte-doux); font-size: 0.9em; }
</style>
