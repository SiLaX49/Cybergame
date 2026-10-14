<script setup lang="ts">
import {
  Aperture, Clapperboard, CloudSun, Gamepad2, Globe, GraduationCap, Inbox, Landmark, MessageCircle, MessageSquareText, MessagesSquare,
  School, ShoppingBag, Store,
} from '@lucide/vue'
import { computed, type Component } from 'vue'
import { appli } from '../applis'

/** Icônes lucide du registre, importées une à une. */
const ICONES: Record<string, Component> = {
  Aperture, Clapperboard, CloudSun, Gamepad2, Globe, GraduationCap, Inbox, Landmark, MessageCircle, MessageSquareText, MessagesSquare,
  School, ShoppingBag, Store,
}

const props = defineProps<{ nom: string }>()
const a = computed(() => appli(props.nom))
</script>

<template>
  <span class="icone-appli" aria-hidden="true" :style="{ background: a.accent, color: a.texteSurAccent }">
    <component :is="ICONES[a.icone]" :size="22" />
  </span>
</template>

<style scoped>
.icone-appli { flex: none; display: inline-grid; place-items: center; width: 2.6em; height: 2.6em; border-radius: 22%; }
</style>
