<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { FIL_ACTIONS, type Fil, type FilAction } from '@/content/schema'
import type { RunEvent } from '@/engine/mission-runner'
import { focusAuMontage } from '@/ui/focus'

const props = defineProps<{ fil: Fil }>()
const emit = defineEmits<{ evenement: [evenement: RunEvent] }>()
const titre = ref<HTMLElement | null>(null)
focusAuMontage(titre)

const LIBELLES: Record<FilAction, string> = {
  ouvrir: 'J’ouvre / je clique',
  verifier: 'Je vérifie autrement',
  signaler: 'Je signale',
  ignorer: 'J’ignore',
}
const actions = reactive<Record<string, FilAction>>({})
const complet = computed(() => props.fil.notifications.every((n) => actions[n.id]))

function valider() {
  if (complet.value) emit('evenement', { type: 'fil-termine', actions: { ...actions } })
}
</script>

<template>
  <section class="fil">
    <h2 ref="titre" tabindex="-1">{{ fil.consigne }}</h2>
    <form @submit.prevent="valider">
      <fieldset v-for="n in fil.notifications" :key="n.id" class="carte notification">
        <legend><span class="app">{{ n.appNom }}</span> &middot; <strong>{{ n.de }}</strong></legend>
        <p>{{ n.texte }}</p>
        <div class="actions-notif">
          <label v-for="a in FIL_ACTIONS" :key="a" class="option">
            <input v-model="actions[n.id]" type="radio" :name="`notif-${n.id}`" :value="a" /> {{ LIBELLES[a] }}
          </label>
        </div>
      </fieldset>
      <button type="submit" class="btn btn-primaire" :disabled="!complet">Valider mes choix</button>
    </form>
  </section>
</template>

<style scoped>
.notification { margin-bottom: 1rem; }
.app { color: var(--texte-doux); }
.actions-notif { display: flex; flex-wrap: wrap; gap: 0 1.25rem; }
</style>
