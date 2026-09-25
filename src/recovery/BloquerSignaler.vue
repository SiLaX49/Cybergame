<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ fait: [] }>()
const etape = ref<'menu' | 'options' | 'signaler' | 'fini'>('menu')
const motif = ref<string | null>(null)
const MOTIFS = ['Arnaque ou fraude', 'Harcèlement', 'Faux compte', 'Autre']
</script>

<template>
  <section class="recuperation carte">
    <h3>Bloque et signale ce compte</h3>
    <template v-if="etape === 'menu'">
      <p>Ouvre le menu du contact.</p>
      <button type="button" class="btn" @click="etape = 'options'"><span aria-hidden="true">⋮</span> Menu du contact</button>
    </template>
    <template v-else-if="etape === 'options'">
      <p>Commence par bloquer : ce compte ne pourra plus te contacter.</p>
      <button type="button" class="btn" @click="etape = 'signaler'"><span aria-hidden="true">🚫</span> Bloquer</button>
    </template>
    <template v-else-if="etape === 'signaler'">
      <fieldset>
        <legend>Compte bloqué. Maintenant, signale-le : pourquoi ?</legend>
        <label v-for="m in MOTIFS" :key="m" class="option">
          <input v-model="motif" type="radio" name="motif" :value="m" /> {{ m }}
        </label>
      </fieldset>
      <button type="button" class="btn btn-primaire" :disabled="!motif" @click="etape = 'fini'">Envoyer le signalement</button>
    </template>
    <template v-else>
      <p role="status">
        <span aria-hidden="true">✅</span> Bloqué et signalé. La plateforme va examiner le compte, et tu protèges
        aussi les autres.
      </p>
      <button type="button" class="btn btn-primaire" @click="emit('fait')">Continuer</button>
    </template>
  </section>
</template>
