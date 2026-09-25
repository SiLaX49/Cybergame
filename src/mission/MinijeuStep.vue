<script setup lang="ts">
import type { Minijeu } from '@/content/schema'
import type { RunEvent } from '@/engine/mission-runner'
import RepereGame from '@/minigames/RepereGame.vue'
import TriGame from '@/minigames/TriGame.vue'

defineProps<{ etape: Minijeu; chrono: boolean }>()
const emit = defineEmits<{ evenement: [evenement: RunEvent] }>()

function terminer(resultat: { reussites: number; erreurs: number }) {
  emit('evenement', { type: 'minijeu-termine', ...resultat })
}
</script>

<template>
  <section class="minijeu">
    <h2>Mini-jeu</h2>
    <TriGame v-if="etape.jeu === 'tri'" :config="etape.config" :chrono="chrono" @termine="terminer" />
    <RepereGame v-else :config="etape.config" @termine="terminer" />
  </section>
</template>
