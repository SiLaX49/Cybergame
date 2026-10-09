<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Hulotte from '@/ui/Hulotte.vue'
</script>

<template>
  <main class="conteneur">
    <div class="carte introuvable">
      <Hulotte expression="reflechit" :taille="120" />
      <h1>Page introuvable</h1>
      <p>Cette page n’existe pas ou plus.</p>
      <RouterLink class="btn btn-primaire" to="/">Retour à l’accueil</RouterLink>
    </div>
  </main>
</template>

<style scoped>
.introuvable { display: grid; justify-items: center; gap: 0.75rem; text-align: center; padding-block: 2rem; }
.introuvable h1, .introuvable p { margin: 0; }
</style>
