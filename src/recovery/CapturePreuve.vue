<script setup lang="ts">
import { ref } from 'vue'
import { focusAuChangement } from '@/ui/focus'
import { CAPTURE_PREUVE as T } from './textes'

const emit = defineEmits<{ fait: [] }>()
const capture = ref(false)
const bloque = ref(false)
const titre = ref<HTMLElement | null>(null)
const boutonBloquer = ref<HTMLElement | null>(null)
// Le bouton cliqué devient inactif ou disparaît : le focus passe à la suite.
focusAuChangement(capture, boutonBloquer)
focusAuChangement(bloque, titre)
</script>

<template>
  <section class="recuperation carte">
    <h3 ref="titre" tabindex="-1">{{ T.titre }}</h3>
    <p>{{ T.consigne }}</p>
    <template v-if="!bloque">
      <div class="actions">
        <button type="button" class="btn" :disabled="capture" @click="capture = true">
          <span aria-hidden="true">📸</span> {{ T.capture }}
        </button>
        <button ref="boutonBloquer" type="button" class="btn" :disabled="!capture" @click="bloque = true">
          <span aria-hidden="true">🚫</span> {{ T.bloquer }}
        </button>
      </div>
      <p v-if="capture" role="status" class="encadre encadre-doux">{{ T.captureFaite }}</p>
    </template>
    <template v-else>
      <p role="status" class="encadre encadre-doux"><span aria-hidden="true">✅</span> {{ T.rappel }}</p>
      <button type="button" class="btn btn-primaire" @click="emit('fait')">Continuer</button>
    </template>
  </section>
</template>

<style scoped>
.encadre { margin: 0.75rem 0; }
</style>
