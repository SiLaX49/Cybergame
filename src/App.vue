<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useProgress } from '@/store/useProgress'
import AppHeader from '@/ui/AppHeader.vue'
import { appliquerReglages } from '@/ui/appliquerReglages'

const store = useProgress()
appliquerReglages(store)

function allerAuContenu() {
  const main = document.querySelector('main')
  if (!main) return
  main.setAttribute('tabindex', '-1')
  main.focus()
}
</script>

<template>
  <button type="button" class="lien-evitement" @click="allerAuContenu">Aller au contenu</button>
  <AppHeader />
  <p v-if="!store.persistant.value" class="alerte-stockage conteneur" role="status">
    Ta progression ne pourra pas être enregistrée sur cet appareil. Tu peux jouer quand même !
  </p>
  <RouterView :key="$route.fullPath" />
</template>

<style>
.lien-evitement { position: absolute; left: -999px; }
.lien-evitement:focus { left: 1rem; top: 1rem; z-index: 10; }
.alerte-stockage { background: #fff8e6; border-left: 4px solid var(--aide); }
</style>
