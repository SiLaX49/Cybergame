<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useProgress } from '@/store/useProgress'
import AppHeader from '@/ui/AppHeader.vue'
import { appliquerReglages } from '@/ui/appliquerReglages'
import UpdatePrompt from '@/ui/UpdatePrompt.vue'

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
  <button type="button" class="lien-evitement btn btn-primaire" @click="allerAuContenu">Aller au contenu</button>
  <AppHeader />
  <UpdatePrompt />
  <p v-if="!store.persistant.value" class="alerte-stockage conteneur" role="status">
    Ta progression ne pourra pas être enregistrée sur cet appareil. Tu peux jouer quand même !
  </p>
  <RouterView :key="$route.fullPath" />
</template>

<style>
.lien-evitement { position: absolute; left: -999px; }
.lien-evitement:focus { left: 1rem; top: 1rem; z-index: 30; }
.alerte-stockage {
  background: var(--aide-fond); color: var(--texte); border-left: 8px solid var(--aide);
  border-radius: var(--rayon-btn); padding: 0.75rem 1rem; margin-block: 1rem;
}
</style>
