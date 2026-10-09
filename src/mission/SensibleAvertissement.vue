<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Hulotte from '@/ui/Hulotte.vue'
import { AVERTISSEMENT as T } from './textesSensibles'

const emit = defineEmits<{ commencer: [] }>()
</script>

<template>
  <section class="encadre encadre-doux avertissement-sensible">
    <Hulotte expression="douce" :taille="80" />
    <div class="corps">
      <h2>{{ T.titre }}</h2>
      <p v-for="p in T.paragraphes" :key="p">{{ p }}</p>
      <div class="actions">
        <button type="button" class="btn btn-primaire" @click="emit('commencer')">{{ T.commencer }}</button>
        <RouterLink class="btn" to="/carte">{{ T.revenir }}</RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.avertissement-sensible { display: flex; align-items: flex-start; gap: 1rem; }
.avertissement-sensible > :first-child { flex: none; }
.corps { min-width: 0; }
.corps h2 { margin-top: 0; }
@media (max-width: 30rem) { .avertissement-sensible { flex-direction: column; } }
</style>
