<script setup lang="ts">
import { Bell, CircleUser, House, MessageSquare } from '@lucide/vue'
import { computed } from 'vue'
import type { Ecran } from '@/content/schema'
import EnteteApp from '../parts/EnteteApp.vue'
import BarreOnglets from './BarreOnglets.vue'

/** ChatCord : colonne étroite de serveurs (pastilles carrées), salon « # » ou contact, 4 onglets en bas. */
const props = defineProps<{ ecran: Extract<Ecran, { app: 'sms' | 'chat' }> }>()
const SERVEURS = ['MC', 'JV', 'MU', 'BD']
const ONGLETS = [
  { nom: 'Serveurs', icone: House },
  { nom: 'Messages', icone: MessageSquare },
  { nom: 'Notifications', icone: Bell },
  { nom: 'Toi', icone: CircleUser },
]
/** Un salon (« Salon … » ou « # … ») s’écrit « # nom-du-salon » ; sinon, le nom du contact. */
const titre = computed(() => {
  const c = props.ecran.contact
  if (!/salon|#/i.test(c)) return c
  return `# ${c.replace(/.*(?:salon|#)\s*/i, '').trim().replace(/\s+/g, '-').toLowerCase()}`
})
</script>

<template>
  <div class="coque coque-chatcord">
    <div class="corps">
      <div class="serveurs" aria-hidden="true">
        <span v-for="(s, i) in SERVEURS" :key="s" class="serveur" :class="{ actif: i === 0 }">{{ s }}</span>
      </div>
      <div class="coque principal">
        <EnteteApp class="sur-accent" :titre="titre" :avatar="!titre.startsWith('#')" riche />
        <slot />
      </div>
    </div>
    <BarreOnglets :onglets="ONGLETS" actif="Messages" />
  </div>
</template>

<style scoped>
.corps { flex: 1; min-height: 0; display: flex; }
.principal { min-width: 0; }
.serveurs { flex: none; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 0.5rem 0.35rem; background: var(--tel-chatcord-serveurs); }
.serveur {
  display: grid; place-items: center; width: 2.25rem; height: 2.25rem; border-radius: 30%;
  background: var(--tel-chatcord-pastille); color: var(--tel-encre); font-size: 0.75rem; font-weight: 700;
}
.serveur.actif { background: var(--marque-accent); color: var(--marque-texte); }
</style>
