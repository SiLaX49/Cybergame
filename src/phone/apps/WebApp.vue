<script setup lang="ts">
import { Package, SlidersHorizontal, TriangleAlert } from '@lucide/vue'
import { computed } from 'vue'
import type { Ecran } from '@/content/schema'
import { useTexte } from '@/ui/useTexte'
import { APPLIS } from '../applis'
import { decouperUrl } from '../liens'
import TexteRiche from '../parts/TexteRiche.vue'

const props = defineProps<{ ecran: Extract<Ecran, { app: 'web' }> }>()
const t = useTexte()
const adresse = computed(() => (props.ecran.url ? decouperUrl(props.ecran.url) : null))
/** Magasin d’applis : fiche de l’appli (note reprise du texte s’il en donne une, badge d’âge, « Obtenir » inerte). */
const magasin = computed(() => APPLIS[props.ecran.appNom]?.marque === 'magasin')
const note = computed(() => props.ecran.messages.map((m) => m.texte.match(/★\s?(\d(?:,\d)?)/)?.[1]).find(Boolean) ?? null)
</script>

<template>
  <div class="web">
    <p v-if="adresse" class="barre-adresse">
      <!-- Icône réglages du site, jamais de cadenas : le domaine entier est ce qui compte. -->
      <SlidersHorizontal class="reglages" aria-hidden="true" :size="16" />
      <span v-if="adresse.nonSecurise" class="non-securise"><TriangleAlert aria-hidden="true" :size="14" /> Non sécurisé</span>
      <span class="visually-hidden">Adresse du site : </span>
      <span class="url"><span class="domaine"><TexteRiche :texte="adresse.domaine" sans-liens /></span><span class="reste"><TexteRiche :texte="adresse.reste" sans-liens /></span></span>
    </p>
    <div v-if="magasin" class="fiche-appli">
      <span class="icone" aria-hidden="true"><Package :size="28" /></span>
      <p class="infos">
        <span class="titre-page">{{ ecran.contact }}</span>
        <span class="details" aria-hidden="true"><span v-if="note">★ {{ note }}</span><span class="age">12+</span></span>
      </p>
      <span class="obtenir" aria-hidden="true">Obtenir</span>
    </div>
    <p v-else class="titre-page">{{ ecran.contact }}</p>
    <p v-for="(m, i) in ecran.messages" :key="i" class="bloc"><TexteRiche :texte="t(m.texte, m.texteSimple)" /></p>
    <p v-if="ecran.boutons" class="boutons-page">
      <span v-for="b in ecran.boutons" :key="b" class="bouton-page"><span class="visually-hidden">Bouton : </span><TexteRiche :texte="b" /></span>
    </p>
  </div>
</template>

<style scoped>
.barre-adresse { display: flex; align-items: center; flex-wrap: wrap; gap: 0.4em; margin: 0 0 0.75rem; padding: 0.35rem 0.7rem; border-radius: 999px; background: var(--tel-recu); font-size: 0.9em; }
.reglages { flex: none; color: var(--tel-doux); }
.non-securise { display: inline-flex; align-items: center; gap: 0.2em; font-weight: 700; color: var(--tel-danger); }
.url { flex: 1 1 6em; min-width: 0; overflow-wrap: anywhere; }
.domaine { font-weight: 700; }
.reste { color: var(--tel-doux); }
.titre-page { margin: 0 0 0.5rem; font-size: 1.15em; font-weight: 700; }
.fiche-appli { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; margin: 0 0 0.75rem; }
.icone { flex: none; display: grid; place-items: center; width: 3.2rem; height: 3.2rem; border-radius: 14px; background: var(--tel-recu); color: var(--tel-doux); }
.infos { flex: 1 1 8em; min-width: 0; display: flex; flex-direction: column; margin: 0; overflow-wrap: anywhere; }
.infos .titre-page { margin: 0; }
.details { display: flex; flex-wrap: wrap; gap: 0.5rem; font-size: 0.85em; color: var(--tel-doux); }
.age { padding: 0 0.35em; border: 1px solid currentColor; border-radius: 4px; font-weight: 700; }
.obtenir { flex: none; padding: 0.35rem 1rem; border-radius: 999px; background: var(--tel-accent); color: var(--tel-accent-texte); font-weight: 700; }
.bloc { margin: 0 0 0.6rem; overflow-wrap: anywhere; }
/* Boutons de la page : inertes, ce n'est pas l'élève qui agit ici mais ses choix. */
.boutons-page { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0 0 0.6rem; }
.bouton-page { padding: 0.35rem 0.9rem; border: 1px solid currentColor; border-radius: 999px; background: var(--tel-recu); font-weight: 700; }
</style>
