<script setup lang="ts">
import { ChevronLeft } from '@lucide/vue'
import Avatar from './Avatar.vue'

defineProps<{ titre: string; sousTitre?: string; avatar?: boolean }>()
</script>

<template>
  <div class="entete-app">
    <ChevronLeft aria-hidden="true" :size="20" />
    <Avatar v-if="avatar" :nom="titre" />
    <p class="titres">
      <strong>{{ titre }}</strong>
      <span v-if="sousTitre" class="sous-titre">{{ sousTitre }}</span>
    </p>
  </div>
</template>

<style scoped>
.entete-app { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--tel-bord); background: var(--tel-fond); color: var(--tel-texte); }
.titres { display: flex; flex-direction: column; margin: 0; min-width: 0; overflow-wrap: anywhere; }
.sous-titre { font-size: 0.8em; color: var(--tel-doux); }
</style>
