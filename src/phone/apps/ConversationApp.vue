<script setup lang="ts">
import { computed } from 'vue'
import type { Ecran } from '@/content/schema'
import Bulle from '../parts/Bulle.vue'

/** `lu` (coque Messages) : « Lu » sous la dernière bulle « Toi ». */
const props = defineProps<{ ecran: Extract<Ecran, { app: 'sms' | 'chat' }>; lu?: boolean }>()
const dernierMoi = computed(() => (props.lu ? props.ecran.messages.map((m) => m.de).lastIndexOf('moi') : -1))
</script>

<template>
  <ol class="conversation">
    <li v-for="(m, i) in ecran.messages" :key="i" :class="m.de">
      <Bulle :message="m" :nom="ecran.contact" />
      <span v-if="i === dernierMoi" class="lu" aria-hidden="true">Lu</span>
    </li>
  </ol>
</template>

<style scoped>
.conversation { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.conversation > li { display: flex; flex-direction: column; }
.lu { align-self: flex-end; margin-top: 0.15rem; font-size: 0.75em; color: var(--tel-doux); }
</style>
