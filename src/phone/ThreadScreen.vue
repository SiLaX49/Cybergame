<script setup lang="ts">
import type { Scenario } from '@/content/schema'
import { useTexte } from '@/ui/useTexte'

defineProps<{ messages: Scenario['ecran']['messages']; contact: string; variante: 'sms' | 'chat' | 'social' }>()
const t = useTexte()
</script>

<template>
  <ol class="fil-messages" :class="variante">
    <li v-for="(m, i) in messages" :key="i" class="bulle" :class="m.de">
      <span class="visually-hidden">{{ m.de === 'moi' ? 'Toi' : contact }} :</span>
      {{ t(m.texte, m.texteSimple) }}
    </li>
  </ol>
</template>

<style scoped>
.fil-messages { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.bulle { max-width: 85%; padding: 0.5rem 0.75rem; border-radius: 16px; overflow-wrap: anywhere; }
.bulle.contact { align-self: flex-start; background: #ececf4; }
.bulle.moi { align-self: flex-end; background: var(--primaire); color: var(--primaire-texte); }
.chat .bulle.contact { background: #e8f0fb; }
.social .bulle.contact { background: #fdf0e6; }
</style>
