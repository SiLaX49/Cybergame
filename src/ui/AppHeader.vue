<script setup lang="ts">
import { ShieldCheck } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import EnTete from './EnTete.vue'
</script>

<template>
  <EnTete classe="app-header">
    <template #gauche>
      <RouterLink to="/" class="logo"><ShieldCheck aria-hidden="true" /> Cyber Réflexes</RouterLink>
    </template>
  </EnTete>
</template>

<style scoped>
.logo { display: inline-flex; align-items: center; gap: 0.4em; font-weight: 700; font-size: 1.2em; text-decoration: none; }
</style>
