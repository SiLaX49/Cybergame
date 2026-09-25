<script setup lang="ts">
import type { Aide } from '@/content/schema'

defineProps<{ aides: Aide[] }>()

const TYPES: Record<Aide['type'], string> = {
  humaine: 'Parler à quelqu’un',
  urgence: 'Urgence',
  signalement: 'Signaler un contenu',
  technique: 'Aide technique',
}
</script>

<template>
  <aside class="bandeau-aide" aria-label="Besoin d’aide ?">
    <p><strong>Besoin d’aide ? C’est gratuit et confidentiel.</strong></p>
    <ul>
      <li v-for="aide in aides" :key="aide.numero">
        <span class="type">{{ TYPES[aide.type] }}</span>
        <strong>{{ aide.numero }}</strong> : {{ aide.libelle }}
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.bandeau-aide {
  position: sticky;
  bottom: 0;
  margin-top: 1.5rem;
  padding: 0.75rem 1rem;
  background: #fff8e6;
  border: 2px solid var(--aide);
  border-radius: var(--rayon);
  font-size: 0.95em;
}
.bandeau-aide ul { margin: 0.25rem 0 0; padding-left: 1.2rem; }
.type { display: inline-block; min-width: 11rem; color: var(--texte-doux); }
</style>
