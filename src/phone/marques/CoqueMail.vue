<script setup lang="ts">
import { Archive, Pencil, Star, Trash2 } from '@lucide/vue'
import type { Ecran } from '@/content/schema'
import EnteteApp from '../parts/EnteteApp.vue'

/** Mail : bandeau sur l’accent (archiver, supprimer, étoile), bouton « Écrire » décoratif en bas, sans cacher le texte. */
defineProps<{ ecran: Ecran }>()
</script>

<template>
  <div class="coque coque-mail">
    <EnteteApp class="sur-accent" :titre="ecran.appNom" sous-titre="Boîte de réception">
      <span class="outils" aria-hidden="true"><Archive :size="20" /><Trash2 :size="20" /><Star class="etoile" :size="20" /></span>
    </EnteteApp>
    <slot />
    <div class="pied" aria-hidden="true">
      <span class="ecrire"><Pencil :size="18" /> Écrire</span>
    </div>
  </div>
</template>

<style scoped>
.coque-mail :deep(.entete-app) { flex-wrap: wrap; }
.coque-mail :deep(.titres) { flex: 1 1 6em; }
.outils { flex: none; margin-left: auto; display: inline-flex; gap: 0.75rem; }
.pied { flex: none; display: flex; justify-content: flex-end; padding: 0.5rem 0.75rem; background: var(--tel-fond); }
.ecrire {
  display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1.1rem; border-radius: 16px;
  background: var(--marque-accent); color: var(--marque-texte); font-weight: 700; box-shadow: 0 2px 6px var(--tel-ombre);
}
</style>
