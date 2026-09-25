<script setup lang="ts">
import { RouterLink } from 'vue-router'

const emit = defineEmits<{ commencer: [] }>()
</script>

<template>
  <section class="carte avertissement-sensible">
    <h2>Avant de commencer</h2>
    <p>Ce sujet peut être difficile. Tu peux passer un scénario à tout moment, sans aucune pénalité.</p>
    <p>
      Si quelque chose te rappelle une situation que tu vis, tu n’as pas à en parler devant les autres. Tu peux en
      parler plus tard à un adulte de confiance, ou appeler le 3018.
    </p>
    <div class="actions">
      <button type="button" class="btn btn-primaire" @click="emit('commencer')">Commencer</button>
      <RouterLink class="btn" to="/carte">Revenir à la carte</RouterLink>
    </div>
  </section>
</template>
