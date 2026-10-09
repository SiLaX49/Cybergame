<script setup lang="ts">
import { ChevronLeft } from '@lucide/vue'
import Avatar from './Avatar.vue'
import TexteRiche from './TexteRiche.vue'

/**
 * `riche` : le titre (nom du contact) est surligné comme le corps des messages ; `sousTitreRiche`, de même pour le
 * sous-titre. Jamais de lien repéré (illisible sur l’accent). Le contenu ajouté suit les titres.
 */
defineProps<{ titre: string; sousTitre?: string; avatar?: boolean; riche?: boolean; sousTitreRiche?: boolean }>()
</script>

<template>
  <div class="entete-app">
    <ChevronLeft aria-hidden="true" :size="20" />
    <Avatar v-if="avatar" :nom="titre" />
    <p class="titres">
      <strong><TexteRiche v-if="riche" :texte="titre" sans-liens /><template v-else>{{ titre }}</template></strong>
      <span v-if="sousTitre" class="sous-titre"><TexteRiche v-if="sousTitreRiche" :texte="sousTitre" sans-liens /><template v-else>{{ sousTitre }}</template></span>
    </p>
    <slot />
  </div>
</template>

<style scoped>
.entete-app { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--tel-bord); background: var(--tel-fond); color: var(--tel-texte); }
.titres { display: flex; flex-direction: column; margin: 0; min-width: 0; overflow-wrap: anywhere; }
.sous-titre { font-size: 0.8em; color: var(--tel-doux); }
</style>
