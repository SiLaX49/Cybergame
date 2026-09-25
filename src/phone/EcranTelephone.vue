<script setup lang="ts">
import type { Scenario } from '@/content/schema'
import MailScreen from './MailScreen.vue'
import PhoneFrame from './PhoneFrame.vue'
import ThreadScreen from './ThreadScreen.vue'
import WebScreen from './WebScreen.vue'

defineProps<{ ecran: Scenario['ecran'] }>()
</script>

<template>
  <PhoneFrame :app-nom="ecran.appNom" :contact="ecran.contact">
    <MailScreen v-if="ecran.app === 'mail'" :contact="ecran.contact" :sujet="ecran.sujet" :messages="ecran.messages" />
    <WebScreen v-else-if="ecran.app === 'web'" :url="ecran.url" :messages="ecran.messages" />
    <ThreadScreen v-else :variante="ecran.app" :contact="ecran.contact" :messages="ecran.messages" />
  </PhoneFrame>
</template>
