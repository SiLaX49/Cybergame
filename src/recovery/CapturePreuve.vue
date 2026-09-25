<script setup lang="ts">
import { ref } from 'vue'
import { focusAuChangement } from '@/ui/focus'

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
    <h3 ref="titre" tabindex="-1">Garde des preuves, puis bloque</h3>
    <p>Avant de bloquer, fais une capture d’écran : une fois le compte bloqué, tu risques de ne plus voir les messages.</p>
    <template v-if="!bloque">
      <div class="actions">
        <button type="button" class="btn" :disabled="capture" @click="capture = true">
          <span aria-hidden="true">📸</span> Faire une capture d’écran
        </button>
        <button ref="boutonBloquer" type="button" class="btn" :disabled="!capture" @click="bloque = true">
          <span aria-hidden="true">🚫</span> Bloquer le compte
        </button>
      </div>
      <p v-if="capture" role="status">Capture enregistrée dans ta galerie, avec la date et le nom du compte.</p>
    </template>
    <template v-else>
      <p role="status">
        <span aria-hidden="true">✅</span> Preuves gardées et compte bloqué. Tu pourras montrer les captures à un
        adulte ou au 3018.
      </p>
      <button type="button" class="btn btn-primaire" @click="emit('fait')">Continuer</button>
    </template>
  </section>
</template>
