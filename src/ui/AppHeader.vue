<script setup lang="ts">
import { Trophy } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { solde } from '@/engine/portefeuille'
import { useProgress } from '@/store/useProgress'
import EnTete from './EnTete.vue'
import Octets from './Octets.vue'

const store = useProgress()
const reserve = computed(() => solde(store.etat))
</script>

<template>
  <EnTete classe="app-header">
    <template #centre>
      <RouterLink to="/profil" class="reserve">
        <span class="visually-hidden">Ta réserve : </span><Octets :valeur="reserve" /> <Trophy aria-hidden="true" class="reserve-trophee" />
      </RouterLink>
    </template>
  </EnTete>
</template>

<style scoped>
.reserve {
  display: inline-flex; align-items: center; gap: 0.4rem; min-height: 44px; padding: 0.2rem 0.9rem; margin-left: auto;
  border-radius: 14px; background: var(--surface); border: 1px solid var(--bord-fort); text-decoration: none;
}
.reserve-trophee { color: var(--or); }
</style>
