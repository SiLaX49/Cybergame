<script setup lang="ts">
import { ChevronLeft } from '@lucide/vue'
import { computed } from 'vue'
import type { Ecran } from '@/content/schema'
import Avatar from '../parts/Avatar.vue'
import TexteRiche from '../parts/TexteRiche.vue'

/** Messages : en-tête centré (avatar, nom ou numéro, « Numéro inconnu »). « Lu » est posé par la conversation. */
const props = defineProps<{ ecran: Extract<Ecran, { app: 'sms' | 'chat' }> }>()
const inconnu = computed(() => !/\p{L}/u.test(props.ecran.contact))
</script>

<template>
  <div class="coque coque-messages">
    <div class="entete-messages">
      <ChevronLeft class="retour" aria-hidden="true" :size="20" />
      <Avatar :nom="ecran.contact" />
      <p class="titres">
        <strong><TexteRiche :texte="ecran.contact" /></strong>
        <span v-if="inconnu" class="inconnu">Numéro inconnu</span>
      </p>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.entete-messages {
  position: relative; display: flex; flex-direction: column; align-items: center; gap: 0.25rem; padding: 0.5rem 2.25rem;
  border-bottom: 1px solid var(--tel-bord); background: var(--tel-fond); color: var(--tel-texte); text-align: center;
}
.retour { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); }
.titres { display: flex; flex-direction: column; margin: 0; max-width: 100%; overflow-wrap: anywhere; }
.inconnu { font-size: 0.8em; color: var(--tel-doux); }
</style>
