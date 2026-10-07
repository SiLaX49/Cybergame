<script setup lang="ts">
import type { Theme } from '@/content/schema'
import { ICONES_THEMES } from './icons'

withDefaults(defineProps<{ theme: Pick<Theme, 'id' | 'icone'>; taille?: number }>(), { taille: 24 })
</script>

<template>
  <span class="pastille-theme" :data-accent="theme.id" aria-hidden="true">
    <component :is="ICONES_THEMES[theme.icone]" :size="taille" />
  </span>
</template>
