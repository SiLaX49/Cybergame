<script setup lang="ts">
import type { Ecran } from '@/content/schema'
import EnteteApp from '../parts/EnteteApp.vue'
import BarreOnglets from './BarreOnglets.vue'

/** GameBox (et GameBox Chat) : bandeau du haut avec le solde en Gemmes (monnaie hexagonale), onglets Chat / Moi. */
defineProps<{ ecran: Extract<Ecran, { app: 'sms' | 'chat' }> }>()
const ONGLETS = [{ nom: 'Chat' }, { nom: 'Moi' }]
</script>

<template>
  <div class="coque coque-gamebox">
    <EnteteApp class="sur-accent" :titre="ecran.contact" avatar riche>
      <span class="solde" aria-hidden="true"><span class="hexagone">💎</span> 1&nbsp;250 Gemmes</span>
    </EnteteApp>
    <slot />
    <BarreOnglets :onglets="ONGLETS" actif="Chat" />
  </div>
</template>

<style scoped>
/* Texte très grand : le solde passe à la ligne plutôt que d’écraser le nom. */
.coque-gamebox :deep(.entete-app) { flex-wrap: wrap; }
.coque-gamebox :deep(.titres) { flex: 1 1 6em; }
.solde {
  flex: none; margin-left: auto; display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.15rem 0.6rem 0.15rem 0.2rem;
  border-radius: 999px; background: var(--tel-blanc); color: var(--tel-encre); font-size: 0.85em; font-weight: 700; white-space: nowrap;
}
.hexagone {
  display: inline-grid; place-items: center; width: 1.6em; height: 1.6em; font-size: 0.85em; background: var(--tel-encre);
  clip-path: polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%);
}
</style>
