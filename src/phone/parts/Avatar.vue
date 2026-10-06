<script setup lang="ts">
import { User } from '@lucide/vue'
import { computed } from 'vue'
import { initiales, teinte } from '../avatar'

const props = defineProps<{ nom: string }>()
const lettres = computed(() => initiales(props.nom))
</script>

<template>
  <span class="avatar" aria-hidden="true" :style="{ background: `hsl(${teinte(nom)} 45% 30%)` }">
    <template v-if="lettres">{{ lettres }}</template>
    <User v-else :size="18" />
  </span>
</template>

<style scoped>
.avatar { flex: none; display: inline-grid; place-items: center; width: 2.2em; height: 2.2em; border-radius: 50%; color: #fff; font-size: 0.85em; font-weight: 700; }
</style>
