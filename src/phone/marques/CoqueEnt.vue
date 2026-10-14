<script setup lang="ts">
import { BookOpen, CalendarDays, ChartColumn } from '@lucide/vue'
import type { Ecran } from '@/content/schema'
import EnteteApp from '../parts/EnteteApp.vue'

/**
 * ENT (Mon Collège, Mon Lycée) : en-tête sur l’accent (contact d’une conversation en sous-titre), menu décoratif
 * Emploi du temps / Notes / Cahier de textes.
 */
defineProps<{ ecran: Ecran }>()
const MENU = [
  { nom: 'Emploi du temps', icone: CalendarDays },
  { nom: 'Notes', icone: ChartColumn },
  { nom: 'Cahier de textes', icone: BookOpen },
]
</script>

<template>
  <div class="coque coque-ent">
    <EnteteApp class="sur-accent" :titre="ecran.appNom" :sous-titre="ecran.app === 'sms' || ecran.app === 'chat' ? ecran.contact : undefined" sous-titre-riche />
    <div class="menu" aria-hidden="true">
      <span v-for="m in MENU" :key="m.nom" class="rubrique" :data-rubrique="m.nom"><component :is="m.icone" :size="16" /> {{ m.nom }}</span>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.menu { flex: none; display: flex; flex-wrap: wrap; gap: 0.4rem; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--tel-bord); background: var(--tel-fond); }
.rubrique { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.6rem; border-radius: 999px; background: var(--tel-recu); font-size: 0.85em; font-weight: 700; }
</style>
