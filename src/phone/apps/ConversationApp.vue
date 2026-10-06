<script setup lang="ts">
import type { Ecran } from '@/content/schema'
import Bulle from '../parts/Bulle.vue'

defineProps<{ ecran: Extract<Ecran, { app: 'sms' | 'chat' }> }>()
</script>

<template>
  <ol class="conversation">
    <li v-for="(m, i) in ecran.messages" :key="i" :class="m.de"><Bulle :message="m" :nom="ecran.contact" /></li>
  </ol>
</template>

<style scoped>
.conversation { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.conversation > li { display: flex; flex-direction: column; }
</style>
