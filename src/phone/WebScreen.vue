<script setup lang="ts">
import { Lock } from '@lucide/vue'
import type { Scenario } from '@/content/schema'
import { useTexte } from '@/ui/useTexte'

defineProps<{ url?: string; messages: Scenario['ecran']['messages'] }>()
const t = useTexte()
</script>

<template>
  <div class="web">
    <p class="barre-adresse">
      <Lock aria-hidden="true" :size="14" />
      <span class="visually-hidden">Adresse du site :</span>
      {{ url ?? 'adresse masquée' }}
    </p>
    <div class="page">
      <p v-for="(m, i) in messages" :key="i">{{ t(m.texte, m.texteSimple) }}</p>
    </div>
  </div>
</template>

<style scoped>
.barre-adresse {
  display: flex; align-items: center; gap: 0.4em; margin: 0 0 0.75rem;
  padding: 0.25em 0.8em; border-radius: 999px; border: 1px solid var(--bord-fort);
  background: var(--surface-2); font-size: 0.9em; overflow-wrap: anywhere;
}
.page a { color: var(--primaire); }
</style>
