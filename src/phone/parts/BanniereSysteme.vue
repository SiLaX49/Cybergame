<script setup lang="ts">
import type { Geste } from '@/content/schema'
import { GESTES_TELEPHONE } from '../gestes'

defineProps<{ geste: Geste }>()
</script>

<template>
  <p class="banniere">
    <component :is="GESTES_TELEPHONE[geste].icone" aria-hidden="true" :size="16" />
    {{ GESTES_TELEPHONE[geste].banniere }}
  </p>
</template>

<style scoped>
.banniere { display: flex; align-items: center; gap: 0.4rem; margin: 0.75rem auto 0; padding: 0.4rem 0.8rem; width: fit-content; max-width: 100%; border-radius: 999px; background: var(--tel-coque); color: #fff; font-size: 0.9em; animation: apparaitre 150ms ease-out; }
@keyframes apparaitre { from { opacity: 0; } to { opacity: 1; } }
</style>
