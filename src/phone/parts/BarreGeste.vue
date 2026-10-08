<script setup lang="ts">
/** Barre de geste en bas de l’écran : revient à l’écran d’accueil. */
const emit = defineEmits<{ accueil: [] }>()
</script>

<template>
  <button type="button" class="barre-geste" aria-label="Revenir à l’écran d’accueil" @click="emit('accueil')">
    <span aria-hidden="true" />
  </button>
</template>

<style scoped>
.barre-geste { flex: none; display: grid; place-items: center; min-height: 32px; border: 0; background: var(--tel-fond); cursor: pointer; }
.barre-geste span { width: 8rem; height: 5px; border-radius: 999px; background: var(--tel-texte); }
.barre-geste:focus-visible { outline: 3px solid var(--focus); outline-offset: -3px; }
</style>
