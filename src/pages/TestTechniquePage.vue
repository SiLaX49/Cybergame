<script setup lang="ts">
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
    <h1>Test technique du poste</h1>
    <p role="status" class="verdict carte">
      <span v-if="resultat.pret" class="badge badge-bon"><span aria-hidden="true">✅</span> Prêt</span>
      <span v-else class="badge badge-risque"><span aria-hidden="true">❌</span> Pas prêt</span>
      <strong v-if="resultat.pret">Ce poste est prêt pour jouer.</strong>
      <strong v-else>Ce poste n’est pas prêt : voir ci-dessous.</strong>
    </p>
    <ul class="verifs">
      <li v-for="v in resultat.verifs" :key="v.id" class="verif carte">
        <span v-if="v.ok" class="badge badge-bon"><span aria-hidden="true">✅</span> OK</span>
        <span v-else-if="v.bloquant" class="badge badge-risque"><span aria-hidden="true">❌</span> À corriger</span>
        <span v-else class="badge badge-aide"><span aria-hidden="true">⚠️</span> À surveiller</span>
        <span><strong>{{ v.libelle }}</strong> : {{ v.ok ? 'OK' : v.conseil }}</span>
      </li>
    </ul>
    <div class="actions">
      <button type="button" class="btn btn-primaire" @click="resultat = lancer()">Relancer le test</button>
      <RouterLink class="btn btn-secondaire" to="/enseignants">Retour à l’espace enseignants</RouterLink>
    </div>
  </main>
</template>

<style scoped>
.test-technique { display: grid; gap: 1rem; }
.test-technique h1 { margin-bottom: 0; }
.verdict { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.75rem; margin: 0; }
.verifs { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.75rem; }
.verif { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem 0.75rem; }
</style>
