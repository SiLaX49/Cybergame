<script setup lang="ts">
import { useId } from 'vue'
import IconeAppli from './IconeAppli.vue'

/** Notification d’entrée d’un scénario, sur l’écran verrouillé : la toucher ouvre l’appli. */
defineProps<{ appNom: string; de: string; texte: string; heure?: string }>()
const emit = defineEmits<{ ouvrir: [] }>()
const id = useId()
</script>

<template>
  <button
    type="button"
    class="notification-entrante"
    data-notification
    :aria-label="`Ouvrir la notification ${appNom} de ${de}`"
    :aria-describedby="id"
    @click="emit('ouvrir')"
  >
    <IconeAppli :nom="appNom" />
    <span class="corps">
      <span class="ligne"><span>{{ appNom }}</span><span v-if="heure">{{ heure }}</span></span>
      <strong>{{ de }}</strong>
      <span :id="id">{{ texte }}</span>
    </span>
  </button>
</template>

<style scoped>
.notification-entrante { display: flex; gap: 0.6rem; width: 100%; padding: 0.6rem; text-align: left; border: 0; border-radius: 16px; background: var(--tel-recu); color: var(--tel-texte); font: inherit; cursor: pointer; }
.notification-entrante:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.corps { display: flex; flex-direction: column; min-width: 0; overflow-wrap: anywhere; }
.ligne { display: flex; justify-content: space-between; gap: 0.5rem; font-size: 0.8em; color: var(--tel-doux); }
/* Glisse du haut une fois ; coupé en mouvement réduit et avec le réglage « animations » (base.css). */
@media (prefers-reduced-motion: no-preference) { .notification-entrante { animation: glisse 300ms ease-out; } }
@keyframes glisse { from { transform: translateY(-1.5rem); } }
</style>
