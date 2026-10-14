<script setup lang="ts">
defineProps<{ apercu: { titre: string; domaine: string } }>()
</script>

<template>
  <p class="apercu">
    <span class="visually-hidden">Aperçu du lien : </span>
    <strong>{{ apercu.titre }}</strong>
    <span class="domaine">{{ apercu.domaine }}</span>
  </p>
</template>

<style scoped>
.apercu { display: flex; flex-direction: column; margin: 0.4rem 0 0; padding: 0.4rem 0.6rem; border-radius: 10px; background: var(--tel-fond); color: var(--tel-texte); overflow-wrap: anywhere; }
.domaine { font-size: 0.8em; color: var(--tel-doux); }
</style>
