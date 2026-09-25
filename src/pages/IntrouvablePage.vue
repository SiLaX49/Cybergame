<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="conteneur">
    <h1>Page introuvable</h1>
    <p>Cette page n'existe pas ou plus.</p>
    <RouterLink class="btn" to="/">Retour à l'accueil</RouterLink>
  </main>
</template>
