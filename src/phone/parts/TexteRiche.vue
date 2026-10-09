<script setup lang="ts">
import { computed, inject } from 'vue'
import { CLE_PASSAGES, decouperTexte } from '../surlignage'

/** `sansLiens` : aucun lien repéré (barre d’adresse, adresse mail, nom de compte). */
const props = defineProps<{ texte: string; sansLiens?: boolean }>()
const passages = inject(CLE_PASSAGES, null)
const morceaux = computed(() => decouperTexte(props.texte, passages?.value ?? [], !props.sansLiens))
</script>

<template>
  <template v-for="(m, i) in morceaux" :key="i">
    <span v-if="m.type === 'lien'" class="lien"><span class="visually-hidden">lien : </span>{{ m.texte }}</span>
    <mark v-else-if="m.type === 'passage'" class="passage" :class="{ numerote: m.numero }" :style="m.numero ? { '--rang': m.numero } : undefined">
      <span v-if="m.numero" class="numero" aria-hidden="true">{{ m.numero }}</span>
      <span class="visually-hidden">{{ m.numero ? `indice ${m.numero} :` : 'indice :' }} </span>{{ m.texte }}
    </mark>
    <template v-else>{{ m.texte }}</template>
  </template>
</template>

<style scoped>
.lien { color: var(--tel-lien); text-decoration: underline; overflow-wrap: anywhere; }
/* Surlignage : fond clair, texte foncé (contraste élevé), pastille numérotée ; fondu décalé de 150 ms par numéro. */
.passage { padding: 0 0.15em; border-radius: 4px; background: var(--tel-passage); color: var(--tel-passage-texte); box-decoration-break: clone; -webkit-box-decoration-break: clone; }
.passage.numerote { animation: surligner 200ms ease-out both; animation-delay: calc((var(--rang) - 1) * 150ms); }
.numero {
  display: inline-flex; align-items: center; justify-content: center; min-width: 1.35em; height: 1.35em; margin-right: 0.2em;
  border-radius: 999px; background: var(--tel-passage-texte); color: var(--tel-passage); font-size: 0.8em; font-weight: 700; vertical-align: 0.1em;
}
@keyframes surligner { from { background: transparent; } }
</style>
