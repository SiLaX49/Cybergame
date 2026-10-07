<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="pied">
    <nav aria-label="Liens utiles" class="conteneur liens">
      <RouterLink to="/enseignants">Espace enseignants</RouterLink>
      <RouterLink to="/confidentialite">Confidentialité</RouterLink>
      <RouterLink to="/test">Test technique du poste</RouterLink>
    </nav>
  </footer>
</template>

<style scoped>
.pied { margin-top: 2rem; background: var(--surface); border-top: 1px solid var(--bord); }
.liens { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; padding-top: 0.75rem; padding-bottom: 0.75rem; }
</style>
