<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, updateServiceWorker } = useRegisterSW()
const plusTard = () => {
  needRefresh.value = false
}
</script>

<template>
  <div v-if="needRefresh" class="maj carte" role="status">
    <p>Une nouvelle version du jeu est disponible.</p>
    <div class="actions">
      <button type="button" class="btn btn-primaire" @click="updateServiceWorker(true)">Recharger</button>
      <button type="button" class="btn btn-secondaire" @click="plusTard">Plus tard</button>
    </div>
  </div>
</template>

<style scoped>
.maj { position: fixed; inset: auto 1rem 1rem auto; max-width: 24rem; z-index: 20; box-shadow: 0 4px 0 var(--bord-fort); }
.maj p { margin-top: 0; }
</style>
