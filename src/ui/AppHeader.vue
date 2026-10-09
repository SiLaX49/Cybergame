<script setup lang="ts">
import { RouterLink } from 'vue-router'
import EnTete from './EnTete.vue'
import Hulotte from './Hulotte.vue'
</script>

<template>
  <EnTete classe="app-header">
    <template #gauche>
      <RouterLink to="/" class="logo">
        <Hulotte expression="accueil" :taille="36" /> <span>Cyber <b>Réflexes</b></span>
      </RouterLink>
    </template>
  </EnTete>
</template>

<style scoped>
.logo {
  display: inline-flex; align-items: center; gap: 0.5rem; min-height: 44px;
  font-family: var(--police-titres); font-weight: 700; font-size: 1.3em;
  color: var(--texte); text-decoration: none;
}
.logo b { color: var(--primaire); }
</style>
