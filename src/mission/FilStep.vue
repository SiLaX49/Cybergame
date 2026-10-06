<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { Fil, FilAction } from '@/content/schema'
import type { RunEvent } from '@/engine/mission-runner'
import Telephone from '@/phone/Telephone.vue'
import { focusAuMontage } from '@/ui/focus'

const props = defineProps<{ fil: Fil }>()
const emit = defineEmits<{ evenement: [evenement: RunEvent] }>()
const titre = ref<HTMLElement | null>(null)
focusAuMontage(titre)

const actions = reactive<Record<string, FilAction>>({})
const traitees = computed(() => props.fil.notifications.filter((n) => actions[n.id]).length)
const complet = computed(() => traitees.value === props.fil.notifications.length)

function valider() {
  if (complet.value) emit('evenement', { type: 'fil-termine', actions: { ...actions } })
}
</script>

<template>
  <section class="fil">
    <h2 ref="titre" tabindex="-1">{{ fil.consigne }}</h2>
    <div class="fil-grille">
      <Telephone
        :ecran="{ app: 'verrouillage', notifications: fil.notifications }"
        :actions-notif="actions"
        @agir="(id, a) => (actions[id] = a)"
      />
      <div class="fil-panneau">
        <p role="status">Notifications traitées : {{ traitees }} sur {{ fil.notifications.length }}</p>
        <button type="button" class="btn btn-primaire" :disabled="!complet" @click="valider">Valider mes choix</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.fil-grille { display: grid; gap: 1.5rem; grid-template-columns: var(--tel-largeur) minmax(0, 1fr); align-items: start; }
@media (max-width: 48rem) { .fil-grille { grid-template-columns: minmax(0, 1fr); } }
</style>
