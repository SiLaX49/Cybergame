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
  <main class="conteneur">
    <h1>Test technique du poste</h1>
    <p role="status" class="verdict">
      <strong v-if="resultat.pret"><span aria-hidden="true">✅</span> Ce poste est prêt pour jouer.</strong>
      <strong v-else><span aria-hidden="true">❌</span> Ce poste n’est pas prêt : voir ci-dessous.</strong>
    </p>
    <ul class="verifs">
      <li v-for="v in resultat.verifs" :key="v.id" class="verif">
        <span aria-hidden="true">{{ v.ok ? '✅' : v.bloquant ? '❌' : '⚠️' }}</span>
        <strong>{{ v.libelle }}</strong> : {{ v.ok ? 'OK' : v.conseil }}
      </li>
    </ul>
    <div class="actions">
      <button type="button" class="btn" @click="resultat = lancer()">Relancer le test</button>
      <RouterLink class="btn" to="/enseignants">Retour à l’espace enseignants</RouterLink>
    </div>
  </main>
</template>
