<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { Fil, FilAction } from '@/content/schema'
import type { RunEvent } from '@/engine/mission-runner'
import SceneTelephone from '@/phone/SceneTelephone.vue'
import { focusAuMontage } from '@/ui/focus'

const props = defineProps<{ fil: Fil }>()
const emit = defineEmits<{ evenement: [evenement: RunEvent] }>()
const titre = ref<HTMLElement | null>(null)
focusAuMontage(titre)

const actions = reactive<Record<string, FilAction>>({})
const traitees = computed(() => props.fil.notifications.filter((n) => actions[n.id]).length)
const complet = computed(() => traitees.value === props.fil.notifications.length)

const scene = computed(() => ({ ecran: { app: 'verrouillage' as const, notifications: props.fil.notifications }, actionsNotif: actions }))

function valider() {
  if (complet.value) emit('evenement', { type: 'fil-termine', actions: { ...actions } })
}
</script>

<template>
  <section class="fil">
    <SceneTelephone :scene="scene" @agir="(id, a) => (actions[id] = a)">
      <template #entete>
        <h2 ref="titre" tabindex="-1">{{ fil.consigne }}</h2>
      </template>
      <p role="status">Notifications traitées : {{ traitees }} sur {{ fil.notifications.length }}</p>
      <button type="button" class="btn btn-primaire" :disabled="!complet" @click="valider">Valider mes choix</button>
    </SceneTelephone>
  </section>
</template>

<style scoped>
.fil { min-height: 0; }
</style>
