<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { AVERTISSEMENT as T } from './textesSensibles'

const emit = defineEmits<{ commencer: [] }>()
</script>

<template>
  <section class="carte avertissement-sensible">
    <h2>{{ T.titre }}</h2>
    <p v-for="p in T.paragraphes" :key="p">{{ p }}</p>
    <div class="actions">
      <button type="button" class="btn btn-primaire" @click="emit('commencer')">{{ T.commencer }}</button>
      <RouterLink class="btn" to="/carte">{{ T.revenir }}</RouterLink>
    </div>
  </section>
</template>
