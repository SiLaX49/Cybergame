<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { useProgress } from '@/store/useProgress'
import AppHeader from '@/ui/AppHeader.vue'
import BarreLaterale from '@/ui/BarreLaterale.vue'
import PiedDePage from '@/ui/PiedDePage.vue'
import { appliquerReglages } from '@/ui/appliquerReglages'
import UpdatePrompt from '@/ui/UpdatePrompt.vue'

const store = useProgress()
appliquerReglages(store)
// La mission a sa propre barre (MissionBarre) et occupe tout l'écran : ni menu, ni en-tête global, ni pied de page.
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
  <UpdatePrompt />
  <div v-if="route.name !== 'mission'" class="coquille">
    <BarreLaterale />
    <div class="coquille-contenu">
      <AppHeader />
      <p v-if="!store.persistant.value" class="alerte-stockage conteneur" role="status">
        Ta progression ne pourra pas être enregistrée sur cet appareil. Tu peux jouer quand même !
      </p>
      <RouterView :key="$route.fullPath" />
      <PiedDePage />
    </div>
  </div>
  <template v-else>
    <p v-if="!store.persistant.value" class="alerte-stockage conteneur" role="status">
      Ta progression ne pourra pas être enregistrée sur cet appareil. Tu peux jouer quand même !
    </p>
    <RouterView :key="$route.fullPath" />
  </template>
</template>

<style>
.lien-evitement { position: absolute; left: -999px; }
.lien-evitement:focus { left: 1rem; top: 1rem; z-index: 30; }
.alerte-stockage {
  background: var(--aide-fond); color: var(--texte); border-left: 4px solid var(--aide);
  border-radius: var(--rayon-btn); padding: 0.75rem 1rem; margin-block: 1rem;
}
.coquille { display: grid; grid-template-columns: minmax(0, 1fr); min-height: 100vh; }
.coquille-contenu { display: flex; flex-direction: column; min-width: 0; }
.coquille-contenu > main { flex: 1 0 auto; align-content: start; }
@media (min-width: 64rem) {
  .coquille { grid-template-columns: 16rem minmax(0, 1fr); }
}
</style>
