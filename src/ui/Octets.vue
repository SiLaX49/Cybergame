<!-- eslint-disable vue/multi-word-component-names -- nom imposé : « Octets » est la monnaie du jeu -->
<script setup lang="ts">
import { Coins } from '@lucide/vue'

/** Une somme d’octets : l’icône est un décor, le texte dit toujours « octets ». */
withDefaults(defineProps<{ valeur: number; signe?: boolean }>(), { signe: false })
const format = new Intl.NumberFormat('fr-FR')
</script>

<template>
  <span class="octets"><Coins aria-hidden="true" class="octets-icone" />{{ signe ? '+' : '' }}{{ format.format(valeur) }} octet{{ valeur > 1 ? 's' : '' }}</span>
</template>

<style scoped>
.octets { display: inline-flex; align-items: center; gap: 0.35em; font-family: var(--police-titres); font-weight: 700; color: var(--or); white-space: nowrap; }
.octets-icone { width: 1.1em; height: 1.1em; flex: none; }
</style>
