<script setup lang="ts">
import { Check, Info, X } from '@lucide/vue'

/** `vrai` : choix risqué sur un message vrai (situation fiable) ; ce n’était pas un piège. */
const props = defineProps<{ verdict: 'piege' | 'bon' | 'vrai' }>()
const AFFICHAGE = { piege: { icone: X, texte: 'Piège' }, bon: { icone: Check, texte: 'Bon réflexe' }, vrai: { icone: Info, texte: 'Message vrai' } }
</script>

<template>
  <!-- Jamais la couleur seule : icône et texte. -->
  <p class="verdict" :class="props.verdict">
    <component :is="AFFICHAGE[props.verdict].icone" aria-hidden="true" :size="20" :stroke-width="3" />
    {{ AFFICHAGE[props.verdict].texte }}
  </p>
</template>

<style scoped>
.verdict {
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  margin: 0.75rem 0 0; padding: 0.5rem 0.9rem; border-radius: 12px; color: var(--tel-blanc); font-weight: 700; font-size: 1.05em;
  animation: apparaitre 200ms ease-out;
}
.verdict.piege { background: var(--tel-verdict-piege); }
.verdict.bon { background: var(--tel-verdict-bon); }
.verdict.vrai { background: var(--tel-verdict-vrai); }
@keyframes apparaitre { from { opacity: 0; } to { opacity: 1; } }
</style>
