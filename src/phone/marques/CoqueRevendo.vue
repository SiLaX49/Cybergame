<script setup lang="ts">
import { ShoppingBag } from '@lucide/vue'
import { computed } from 'vue'
import type { Ecran } from '@/content/schema'
import EnteteApp from '../parts/EnteteApp.vue'

/** Revendo : fiche de l’objet épinglée en haut si le premier message donne un prix (prix en gras, « Acheter » inerte). */
const props = defineProps<{ ecran: Extract<Ecran, { app: 'sms' | 'chat' }> }>()
/** Motif `\d+ ?€`, élargi aux centimes (« 1,99 € ») et aux espaces insécables. */
const prix = computed(() => props.ecran.messages[0]?.texte.match(/\d+(?:[,.]\d+)?\s?€/)?.[0] ?? null)
</script>

<template>
  <div class="coque coque-revendo">
    <EnteteApp class="sur-accent" :titre="ecran.contact" avatar riche />
    <div v-if="prix" class="fiche">
      <span class="vignette" aria-hidden="true"><ShoppingBag :size="20" /></span>
      <p class="infos">
        <span class="visually-hidden">Article épinglé : </span><strong class="prix">{{ prix }}</strong>
        <span class="frais" aria-hidden="true">+ frais de protection</span>
      </p>
      <span class="acheter" aria-hidden="true">Acheter</span>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.fiche { flex: none; display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--tel-bord); background: var(--tel-fond); }
.vignette { flex: none; display: grid; place-items: center; width: 2.4rem; height: 2.4rem; border-radius: 8px; background: var(--tel-recu); color: var(--tel-doux); }
.infos { flex: 1; min-width: 0; display: flex; flex-direction: column; margin: 0; }
.prix { font-size: 1.1em; }
.frais { font-size: 0.8em; color: var(--tel-doux); }
.acheter { flex: none; padding: 0.35rem 0.8rem; border-radius: 8px; background: var(--marque-accent); color: var(--marque-texte); font-weight: 700; }
</style>
