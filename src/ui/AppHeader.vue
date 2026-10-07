<script setup lang="ts">
import { Settings } from '@lucide/vue'
import { nextTick, ref } from 'vue'
import { RouterLink } from 'vue-router'
import Hulotte from './Hulotte.vue'
import ReglagesPanel from './ReglagesPanel.vue'

const ouvert = ref(false)
const boutonReglages = ref<HTMLButtonElement | null>(null)
async function fermer() {
  ouvert.value = false
  await nextTick()
  boutonReglages.value?.focus()
}
</script>

<template>
  <header class="app-header">
    <div class="barre">
      <RouterLink to="/" class="logo">
        <Hulotte expression="accueil" :taille="36" /> <span>Cyber <b>Réflexes</b></span>
      </RouterLink>
      <nav aria-label="Navigation principale" class="nav">
        <RouterLink to="/enseignants">Enseignants</RouterLink>
        <button
          ref="boutonReglages"
          type="button"
          class="btn btn-secondaire"
          aria-controls="panneau-reglages"
          :aria-expanded="ouvert"
          @click="ouvert = !ouvert"
        >
          <Settings aria-hidden="true" /> Réglages
        </button>
      </nav>
    </div>
  </header>
  <ReglagesPanel v-if="ouvert" @fermer="fermer" />
</template>

<style scoped>
.app-header {
  background: var(--surface); border-bottom: 2px solid var(--bord);
}
/* Collant seulement si l’écran est assez grand : sur petit écran ou fort zoom, il mangerait la page. */
@media (min-width: 40rem) and (min-height: 32rem) {
  .app-header { position: sticky; top: 0; z-index: 10; }
}
.barre {
  display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center;
  gap: 0.5rem; padding: 0.4rem 1rem; max-width: 64rem; margin-inline: auto;
}
.logo {
  display: inline-flex; align-items: center; gap: 0.5rem; min-height: 44px;
  font-family: var(--police-titres); font-weight: 700; font-size: 1.3em;
  color: var(--texte); text-decoration: none;
}
.logo b { color: var(--primaire); }
.nav { display: flex; align-items: center; gap: 0.75rem; }
.nav > a { display: inline-flex; align-items: center; min-height: 44px; padding: 0 0.5rem; font-weight: 700; }
</style>
