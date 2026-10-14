<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { useProgress } from '@/store/useProgress'
import AppHeader from '@/ui/AppHeader.vue'
import PiedDePage from '@/ui/PiedDePage.vue'
import { appliquerReglages } from '@/ui/appliquerReglages'
import UpdatePrompt from '@/ui/UpdatePrompt.vue'

const store = useProgress()
appliquerReglages(store)
// La mission a sa propre barre (MissionBarre) et occupe tout l'écran : ni en-tête global, ni pied de page.
const route = useRoute()

function allerAuContenu() {
  const main = document.querySelector('main')
  if (!main) return
  main.setAttribute('tabindex', '-1')
  main.focus()
}
</script>

<template>
  <button type="button" class="lien-evitement btn btn-primaire" @click="allerAuContenu">Aller au contenu</button>
  <AppHeader v-if="route.name !== 'mission'" />
  <UpdatePrompt />
  <p v-if="!store.persistant.value" class="alerte-stockage conteneur" role="status">
    Ta progression ne pourra pas être enregistrée sur cet appareil. Tu peux jouer quand même !
  </p>
  <RouterView :key="$route.fullPath" />
  <PiedDePage v-if="route.name !== 'mission'" />
</template>

<style>
.lien-evitement { position: absolute; left: -999px; }
.lien-evitement:focus { left: 1rem; top: 1rem; z-index: 30; }
.alerte-stockage {
  background: var(--aide-fond); color: var(--texte); border-left: 8px solid var(--aide);
  border-radius: var(--rayon-btn); padding: 0.75rem 1rem; margin-block: 1rem;
}
</style>
