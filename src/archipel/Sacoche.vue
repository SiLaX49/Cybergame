<!-- eslint-disable vue/multi-word-component-names -- nom imposé : « Sacoche » est le nom de l’objet dans le jeu -->
<script setup lang="ts">
import { useId } from 'vue'

defineProps<{ objets: { theme: string; emoji: string; nom: string; gagne: boolean }[] }>()
const idTitre = useId()
</script>

<template>
  <section v-if="objets.length > 0" class="sacoche carte" :aria-labelledby="idTitre">
    <h2 :id="idTitre">Ta sacoche</h2>
    <ul>
      <li v-for="o in objets" :key="o.theme" class="badge" :class="{ 'badge-bon': o.gagne, 'pas-gagne': !o.gagne }">
        <span class="sacoche-emoji" aria-hidden="true">{{ o.emoji }}</span> {{ o.nom }} : {{ o.gagne ? 'gagné' : 'pas encore' }}
      </li>
    </ul>
  </section>
</template>

<style scoped>
.sacoche { padding: 0.6rem 0.9rem; }
.sacoche h2 { font-size: 1em; margin: 0 0 0.4rem; }
.sacoche ul { display: flex; flex-wrap: wrap; gap: 0.5rem; list-style: none; padding: 0; margin: 0; }
/* « badge » est en nowrap : en très grand texte ou à 320 px, l’étiquette doit pouvoir passer à la ligne. */
.sacoche li { white-space: normal; max-width: 100%; border-radius: 1.25rem; }
.pas-gagne .sacoche-emoji { filter: grayscale(1); }
</style>
