<script setup lang="ts">
import { nextTick, ref, useId } from 'vue'
import { FIL_ACTIONS, type Fil, type FilAction } from '@/content/schema'
import Avatar from '../parts/Avatar.vue'
import NotificationEntrante from '../parts/NotificationEntrante.vue'

/** Écran verrouillé : les notifications d’un fil, ou la seule notification d’entrée d’un scénario (`entree`). */
withDefaults(
  defineProps<{
    notifications?: Fil['notifications']
    actions?: Record<string, FilAction>
    heure: string
    entree?: { appNom: string; de: string; texte: string; heure?: string } | null
  }>(),
  { notifications: () => [], actions: () => ({}), entree: null },
)
const emit = defineEmits<{ agir: [notificationId: string, action: FilAction]; ouvrir: [] }>()

const LIBELLES: Record<FilAction, string> = {
  ouvrir: 'J’ouvre / je clique',
  verifier: 'Je vérifie autrement',
  signaler: 'Je signale',
  ignorer: 'J’ignore',
}
const ETATS: Record<FilAction, string> = { ouvrir: 'Ouverte', verifier: 'Vérifiée autrement', signaler: 'Signalée', ignorer: 'Ignorée' }

const base = useId()
const ouverte = ref<string | null>(null)
const boutons: Record<string, HTMLElement> = {}

function agir(id: string, action: FilAction) {
  emit('agir', id, action)
  ouverte.value = null
  // Le groupe d'actions disparaît : le focus revient sur la notification.
  void nextTick(() => boutons[id]?.focus())
}
</script>

<template>
  <div class="verrouillage">
    <p class="grande-heure" aria-hidden="true">{{ heure }}</p>
    <NotificationEntrante v-if="entree" v-bind="entree" @ouvrir="emit('ouvrir')" />
    <ul v-else class="notifications">
      <li v-for="n in notifications" :key="n.id" class="notification">
        <button
          :ref="(el) => { if (el) boutons[n.id] = el as HTMLElement }"
          type="button"
          class="entete-notif"
          :data-notif="n.id"
          :aria-expanded="ouverte === n.id"
          :aria-controls="`${base}-${n.id}`"
          @click="ouverte = ouverte === n.id ? null : n.id"
        >
          <Avatar :nom="n.appNom" />
          <span class="corps">
            <span class="ligne"><span class="app">{{ n.appNom }}</span><span v-if="n.heure" class="heure">{{ n.heure }}</span></span>
            <strong>{{ n.de }}</strong>
            <span>{{ n.texte }}</span>
            <span class="etat">{{ actions[n.id] ? ETATS[actions[n.id]!] : 'À traiter' }}</span>
          </span>
        </button>
        <div v-if="ouverte === n.id" :id="`${base}-${n.id}`" class="actions-notif" role="group" :aria-label="`Que fais-tu de la notification de ${n.de} ?`">
          <button
            v-for="a in FIL_ACTIONS"
            :key="a"
            type="button"
            class="action-notif"
            :aria-pressed="actions[n.id] === a"
            @click="agir(n.id, a)"
          >
            {{ LIBELLES[a] }}
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.grande-heure { margin: 0.5rem 0 1rem; text-align: center; font-size: 3em; font-weight: 700; }
.notifications { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.entete-notif { display: flex; gap: 0.6rem; width: 100%; padding: 0.6rem; text-align: left; border: 0; border-radius: 16px; background: var(--tel-recu); color: var(--tel-texte); font: inherit; cursor: pointer; }
.entete-notif:focus-visible, .action-notif:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.corps { display: flex; flex-direction: column; min-width: 0; overflow-wrap: anywhere; }
.ligne { display: flex; justify-content: space-between; gap: 0.5rem; font-size: 0.8em; color: var(--tel-doux); }
.etat { margin-top: 0.2rem; font-size: 0.8em; font-weight: 700; color: var(--tel-doux); }
.actions-notif { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; margin-top: 0.4rem; }
.action-notif { min-height: 44px; padding: 0.4rem; border: 2px solid var(--tel-doux); border-radius: 12px; background: transparent; color: var(--tel-texte); font: inherit; cursor: pointer; }
.action-notif[aria-pressed='true'] { background: var(--tel-texte); color: var(--tel-fond); }
</style>
