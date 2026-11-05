<!-- eslint-disable vue/multi-word-component-names -- nom imposé : « Sacoche » est le nom de l’objet dans le jeu -->
<script setup lang="ts">
import { useId } from 'vue'
import type { DessinObjet } from '@/ui/dessins'
import ObjetDessin from '@/ui/ObjetDessin.vue'

defineProps<{ objets: { theme: string; dessin: DessinObjet; nom: string; gagne: boolean }[] }>()
const idTitre = useId()
</script>

<template>
  <section v-if="objets.length > 0" class="sacoche carte" :aria-labelledby="idTitre">
    <h2 :id="idTitre">Ta sacoche</h2>
    <ul>
      <li v-for="o in objets" :key="o.theme" :class="{ gagne: o.gagne }">
        <ObjetDessin :dessin="o.dessin" :taille="40" :terne="!o.gagne" />
        <span class="sacoche-texte">
          <span class="sacoche-nom">{{ o.nom }}</span>
          <span class="sacoche-etat">{{ o.gagne ? 'gagné' : 'pas encore' }}</span>
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
/* Dans la barre d’outils de la carte (flex), la sacoche prend toute la ligne. */
.sacoche { flex: 1 1 100%; padding: 1rem 1.25rem; }
.sacoche h2 { font-size: 1em; margin: 0 0 0.75rem; }
.sacoche ul {
  list-style: none; padding: 0; margin: 0;
  display: grid; gap: 0.5rem 1rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 12rem), 1fr));
}
.sacoche li { display: flex; align-items: center; gap: 0.6rem; min-width: 0; }
.sacoche-texte { display: grid; min-width: 0; line-height: 1.3; }
.sacoche-nom { font-weight: 500; overflow-wrap: anywhere; }
.sacoche-etat { font-size: 0.85em; color: var(--texte-doux); }
.gagne .sacoche-etat { color: var(--bon); font-weight: 600; }
</style>
