<script setup lang="ts">
import { ref } from 'vue'
import type { Minijeu } from '@/content/schema'
import type { RunEvent } from '@/engine/mission-runner'
import ConfidentialiteGame from '@/minigames/ConfidentialiteGame.vue'
import MotDePasseGame from '@/minigames/MotDePasseGame.vue'
import PermissionsGame from '@/minigames/PermissionsGame.vue'
import RepereGame from '@/minigames/RepereGame.vue'
import TriGame from '@/minigames/TriGame.vue'
import VerificationGame from '@/minigames/VerificationGame.vue'
import { focusAuMontage } from '@/ui/focus'

defineProps<{ etape: Minijeu; chrono: boolean }>()
const emit = defineEmits<{ evenement: [evenement: RunEvent] }>()
const titre = ref<HTMLElement | null>(null)
focusAuMontage(titre)

function terminer(resultat: { reussites: number; erreurs: number }) {
  emit('evenement', { type: 'minijeu-termine', ...resultat })
}
</script>

<template>
  <section class="minijeu carte">
    <h2 ref="titre" tabindex="-1">Mini-jeu</h2>
    <TriGame v-if="etape.jeu === 'tri'" :config="etape.config" :chrono="chrono" @termine="terminer" />
    <RepereGame v-else-if="etape.jeu === 'repere'" :config="etape.config" @termine="terminer" />
    <MotDePasseGame v-else-if="etape.jeu === 'motdepasse'" :config="etape.config" @termine="terminer" />
    <ConfidentialiteGame v-else-if="etape.jeu === 'confidentialite'" :config="etape.config" @termine="terminer" />
    <VerificationGame v-else-if="etape.jeu === 'verification'" :config="etape.config" @termine="terminer" />
    <PermissionsGame v-else-if="etape.jeu === 'permissions'" :config="etape.config" @termine="terminer" />
  </section>
</template>

<style scoped>
.minijeu h2 { margin-top: 0; }
</style>
