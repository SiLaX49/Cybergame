<script setup lang="ts">
import { Check, X } from '@lucide/vue'

defineProps<{ verdict: 'piege' | 'bon' }>()
</script>

<template>
  <!-- Jamais la couleur seule : icône et texte. -->
  <p class="verdict" :class="verdict">
    <component :is="verdict === 'piege' ? X : Check" aria-hidden="true" :size="20" :stroke-width="3" />
    {{ verdict === 'piege' ? 'Piège' : 'Bon réflexe' }}
  </p>
</template>

<style scoped>
.verdict {
  position: sticky; bottom: 0; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  margin: 0.75rem 0 0; padding: 0.5rem 0.9rem; border-radius: 12px; color: #fff; font-weight: 700; font-size: 1.05em;
  animation: apparaitre 200ms ease-out;
}
.verdict.piege { background: var(--tel-verdict-piege); }
.verdict.bon { background: var(--tel-verdict-bon); }
@keyframes apparaitre { from { opacity: 0; } to { opacity: 1; } }
</style>
