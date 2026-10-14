<script setup lang="ts">
import { Landmark } from '@lucide/vue'
import type { Ecran } from '@/content/schema'
import EnteteApp from '../parts/EnteteApp.vue'

/** BanqueNova : en-tête seul (le contenu ne donne ni solde ni opérations), contact d’une conversation en sous-titre. */
defineProps<{ ecran: Ecran }>()
</script>

<template>
  <div class="coque coque-banquenova">
    <EnteteApp class="sur-accent" :titre="ecran.appNom" :sous-titre="ecran.app === 'sms' || ecran.app === 'chat' ? ecran.contact : undefined" sous-titre-riche>
      <Landmark class="logo" aria-hidden="true" :size="20" />
    </EnteteApp>
    <slot />
  </div>
</template>

<style scoped>
.logo { flex: none; margin-left: auto; }
</style>
