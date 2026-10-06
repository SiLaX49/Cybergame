<script setup lang="ts">
import { TriangleAlert } from '@lucide/vue'
import { computed } from 'vue'
import type { Ecran } from '@/content/schema'
import { useTexte } from '@/ui/useTexte'
import { decouperUrl } from '../liens'
import TexteRiche from '../parts/TexteRiche.vue'

const props = defineProps<{ ecran: Extract<Ecran, { app: 'web' }> }>()
const t = useTexte()
const adresse = computed(() => (props.ecran.url ? decouperUrl(props.ecran.url) : null))
</script>

<template>
  <div class="web">
    <p v-if="adresse" class="barre-adresse">
      <span v-if="adresse.nonSecurise" class="non-securise"><TriangleAlert aria-hidden="true" :size="14" /> Non sécurisé</span>
      <span class="visually-hidden">Adresse du site : </span>
      <span class="url"><span class="domaine">{{ adresse.domaine }}</span><span class="reste">{{ adresse.reste }}</span></span>
    </p>
    <p class="titre-page">{{ ecran.contact }}</p>
    <p v-for="(m, i) in ecran.messages" :key="i" class="bloc"><TexteRiche :texte="t(m.texte, m.texteSimple)" /></p>
    <p v-if="ecran.boutons" class="boutons-page">
      <span v-for="b in ecran.boutons" :key="b" class="bouton-page" aria-hidden="false"><span class="visually-hidden">Bouton : </span><TexteRiche :texte="b" /></span>
    </p>
  </div>
</template>

<style scoped>
.barre-adresse { display: flex; align-items: center; flex-wrap: wrap; gap: 0.4em; margin: 0 0 0.75rem; padding: 0.35rem 0.7rem; border-radius: 999px; background: var(--tel-recu); font-size: 0.9em; }
.non-securise { display: inline-flex; align-items: center; gap: 0.2em; font-weight: 700; color: #a3200f; }
.url { overflow-wrap: anywhere; }
.domaine { font-weight: 700; }
.reste { color: var(--tel-doux); }
.titre-page { margin: 0 0 0.5rem; font-size: 1.15em; font-weight: 700; }
.bloc { margin: 0 0 0.6rem; overflow-wrap: anywhere; }
/* Boutons de la page : inertes, ce n'est pas l'élève qui agit ici mais ses choix. */
.boutons-page { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0 0 0.6rem; }
.bouton-page { padding: 0.35rem 0.9rem; border: 1px solid currentColor; border-radius: 999px; background: var(--tel-recu); font-weight: 700; }
</style>
