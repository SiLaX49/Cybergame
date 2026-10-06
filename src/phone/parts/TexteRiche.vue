<script setup lang="ts">
import { computed } from 'vue'
import { decouperLiens } from '../liens'

const props = defineProps<{ texte: string }>()
const morceaux = computed(() => decouperLiens(props.texte))
</script>

<template>
  <template v-for="(m, i) in morceaux" :key="i">
    <span v-if="m.type === 'lien'" class="lien"><span class="visually-hidden">lien : </span>{{ m.texte }}</span>
    <template v-else>{{ m.texte }}</template>
  </template>
</template>

<style scoped>
.lien { color: var(--tel-lien); text-decoration: underline; overflow-wrap: anywhere; }
</style>
