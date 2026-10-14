<script setup lang="ts">
import type { Component } from 'vue'

/** Barre d’onglets du bas d’une coque : décorative, rien n’y est actif. Icône seule si elle est donnée, sinon le nom. */
defineProps<{ onglets: { nom: string; icone?: Component }[]; actif: string }>()
</script>

<template>
  <div class="barre-onglets" aria-hidden="true">
    <span v-for="o in onglets" :key="o.nom" class="onglet" :class="{ actif: o.nom === actif }" :data-onglet="o.nom">
      <component :is="o.icone" v-if="o.icone" :size="20" />
      <template v-else>{{ o.nom }}</template>
    </span>
  </div>
</template>

<style scoped>
.barre-onglets { flex: none; display: flex; border-top: 1px solid var(--tel-bord); background: var(--tel-fond); color: var(--tel-doux); }
.onglet { flex: 1; min-width: 0; display: grid; place-items: center; min-height: 2.5rem; font-size: 0.85em; font-weight: 700; border-top: 3px solid transparent; }
.onglet.actif { color: var(--tel-texte); border-top-color: var(--marque-accent); }
</style>
