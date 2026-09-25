<script setup lang="ts">
import { ref } from 'vue'
import { useProgress } from '@/store/useProgress'

const store = useProgress()
const confirmation = ref(false)
const fait = ref(false)

function demander() {
  confirmation.value = true
  fait.value = false
}
function effacer() {
  store.effacer()
  confirmation.value = false
  fait.value = true
}
</script>

<template>
  <div class="effacer">
    <button v-if="!confirmation" type="button" class="btn btn-danger" @click="demander">
      Effacer ma progression
    </button>
    <template v-else>
      <p>Tout effacer sur cet appareil ? (niveau, missions terminées, badges, réglages)</p>
      <div class="actions">
        <button type="button" class="btn btn-danger" @click="effacer">Oui, tout effacer</button>
        <button type="button" class="btn" @click="confirmation = false">Annuler</button>
      </div>
    </template>
    <p v-if="fait" role="status">Ta progression a été effacée.</p>
  </div>
</template>
