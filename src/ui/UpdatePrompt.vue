<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, updateServiceWorker } = useRegisterSW()
const plusTard = () => {
  needRefresh.value = false
}
</script>

<template>
  <div v-if="needRefresh" class="maj carte conteneur" role="status">
    <p>Une nouvelle version du jeu est disponible.</p>
    <div class="actions">
      <button type="button" class="btn btn-primaire" @click="updateServiceWorker(true)">Recharger</button>
      <button type="button" class="btn" @click="plusTard">Plus tard</button>
    </div>
  </div>
</template>
