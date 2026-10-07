<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { nomIle } from '@/archipel/archipel'

const route = useRoute()
const nom = computed(() => nomIle(String(route.params.theme)) ?? 'Île inconnue')
</script>

<template>
  <main class="conteneur">
    <h1>{{ nom }}</h1>
  </main>
</template>
