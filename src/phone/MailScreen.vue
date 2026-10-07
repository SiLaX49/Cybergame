<script setup lang="ts">
import type { Scenario } from '@/content/schema'
import { useTexte } from '@/ui/useTexte'

defineProps<{ contact: string; sujet?: string; messages: Scenario['ecran']['messages'] }>()
const t = useTexte()
</script>

<template>
  <div class="mail">
    <p class="champ"><span class="libelle">De :</span> {{ contact }}</p>
    <p v-if="sujet" class="champ"><span class="libelle">Objet :</span> <strong>{{ sujet }}</strong></p>
    <hr />
    <p v-for="(m, i) in messages" :key="i">{{ t(m.texte, m.texteSimple) }}</p>
  </div>
</template>

<style scoped>
.champ { margin: 0.2rem 0; overflow-wrap: anywhere; }
.libelle { color: var(--texte-doux); }
.mail a { color: var(--primaire); }
.mail hr { border: 0; border-top: 2px solid var(--bord); margin: 0.6rem 0; }
</style>
