<script setup lang="ts">
import type { Qualite } from '@/content/schema'
import { VERDICTS } from './reponseLevier'

/** `indices` : la liste passée au téléphone ; le rang de chaque indice donne le numéro de son passage surligné. */
defineProps<{ indices: { id: string; libelle: string; passage?: string }[]; explication: string; qualite?: Qualite }>()
</script>

<template>
  <section class="explication">
    <p v-if="qualite" class="verdict" :class="qualite">
      <span aria-hidden="true">{{ VERDICTS[qualite].icone }}</span> <strong>{{ VERDICTS[qualite].titre }}</strong>
    </p>
    <h3>Ce qui devait t’alerter</h3>
    <ol class="liste-indices">
      <li v-for="(i, rang) in indices" :key="i.id">
        <span class="numero" aria-hidden="true">{{ rang + 1 }}</span><span class="visually-hidden">indice {{ rang + 1 }} : </span>
        <span class="libelle">{{ i.libelle }}</span>
        <span v-if="i.passage" class="cite">« {{ i.passage }} »</span>
      </li>
    </ol>
    <p>{{ explication }}</p>
  </section>
</template>

<style scoped>
.verdict { font-size: 1.15em; }
.verdict.bon { color: var(--bon); }
.verdict.risque { color: var(--risque); }
.verdict.aide { color: var(--aide); }
.liste-indices { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.liste-indices li { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.4rem; }
/* Même pastille que le passage surligné dans le téléphone (couleurs de theme.css, propres au téléphone). */
.numero {
  display: inline-flex; align-items: center; justify-content: center; min-width: 1.6em; height: 1.6em;
  border-radius: 999px; background: #1b1b2f; color: #fff1a8; font-weight: 700;
}
.cite { font-style: italic; }
</style>
