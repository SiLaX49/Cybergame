<script setup lang="ts">
import type { Message } from '@/content/schema'
import { useTexte } from '@/ui/useTexte'
import ApercuLien from './ApercuLien.vue'
import TexteRiche from './TexteRiche.vue'

defineProps<{ message: Message; nom: string }>()
const t = useTexte()
</script>

<template>
  <div class="bulle" :class="message.de">
    <p class="texte">
      <span class="visually-hidden">{{ message.de === 'moi' ? 'Toi' : nom }} : </span>
      <TexteRiche :texte="t(message.texte, message.texteSimple)" />
    </p>
    <ApercuLien v-if="message.apercu" :apercu="message.apercu" />
    <p v-if="message.heure" class="heure"><span class="visually-hidden">à </span>{{ message.heure }}</p>
  </div>
</template>

<style scoped>
.bulle { max-width: 85%; padding: 0.5rem 0.75rem; border-radius: 18px; overflow-wrap: anywhere; }
.bulle.contact { align-self: flex-start; background: var(--tel-recu); color: var(--tel-texte); border-bottom-left-radius: 4px; }
.bulle.moi { align-self: flex-end; background: var(--tel-envoye); color: var(--tel-envoye-texte); border-bottom-right-radius: 4px; }
.bulle.moi :deep(.lien) { color: inherit; }
.texte { margin: 0; }
.heure { margin: 0.2rem 0 0; font-size: 0.75em; text-align: right; opacity: 0.85; }
</style>
