<script setup lang="ts">
import { RouterLink } from 'vue-router'
import EnTete from '@/ui/EnTete.vue'
import BoutonIndice from './BoutonIndice.vue'

/**
 * Barre unique de la mission ; `etape` (à partir de 1) absente : pas de progression.
 * `indice` absent : pas de bouton « Indice » ; `joue` : bouton enfoncé.
 */
defineProps<{ titre: string; etape?: number; total?: number; indice?: 'disponible' | 'joue' }>()
const emit = defineEmits<{ indice: [] }>()
</script>

<template>
  <EnTete classe="mission-barre">
    <template #gauche>
      <RouterLink to="/carte" class="retour"><span aria-hidden="true">←</span> Carte</RouterLink>
    </template>
    <template #centre>
      <h1>{{ titre }}</h1>
      <p v-if="etape !== undefined && total" class="progression">
        <label for="progression-mission">Étape {{ etape }} sur {{ total }}</label>
        <progress id="progression-mission" :value="etape - 1" :max="total" />
      </p>
      <BoutonIndice v-if="indice" :actif="indice === 'joue'" @indice="emit('indice')" />
    </template>
  </EnTete>
</template>

<style scoped>
.retour { font-weight: 700; }
h1 { flex: 1 1 10rem; min-width: 0; margin: 0; font-size: 1.1em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.progression { display: flex; align-items: center; gap: 0.5rem; margin: 0; }
progress { width: 6rem; height: 0.6rem; }
</style>
