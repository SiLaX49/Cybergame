<script setup lang="ts">
import { Award } from '@lucide/vue'
import { computed, nextTick, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Mission, Scenario } from '@/content/schema'
import { BADGES, calculerBadges } from '@/engine/badges'
import type { RunState, SurpriseResultat } from '@/engine/mission-runner'
import { focusAuMontage } from '@/ui/focus'
import { useTexte } from '@/ui/useTexte'

const props = defineProps<{ mission: Mission; etat: RunState }>()
const emit = defineEmits<{ rejouer: [] }>()
const t = useTexte()
const titre = ref<HTMLElement | null>(null)
focusAuMontage(titre)

const badges = computed(() => calculerBadges(props.etat))
const aRetenir = computed(() =>
  props.mission.etapes
    .filter((e): e is Scenario => e.type === 'scenario')
    .filter((s) => {
      const r = props.etat.resultats[s.id]
      return r?.type === 'scenario' && !r.passe
    }),
)

const MESSAGES_SURPRISE: Record<SurpriseResultat, string> = {
  piege: 'Tu as ouvert ce message piège. Pas de panique : l’important, c’est de reconnaître les signaux la prochaine fois.',
  verifie: 'Tu as vérifié autrement : c’est le meilleur réflexe !',
  signale: 'Tu l’as signalé : bravo, tu protèges aussi les autres.',
  ignore: 'Tu l’as ignoré : tu ne t’es pas fait piéger. Le signaler aide aussi les autres.',
}
const surprise = computed(() => {
  for (const e of props.mission.etapes) {
    if (e.type !== 'fil') continue
    const notification = e.notifications.find((n) => n.surprise)
    const r = props.etat.resultats[e.id]
    if (notification && r?.type === 'fil' && r.surprise) return { notification, resultat: r.surprise }
  }
  return null
})

const pleinEcran = ref(false)
const dialogue = ref<HTMLDialogElement | null>(null)
const boutonOuvrir = ref<HTMLButtonElement | null>(null)
const boutonFermer = ref<HTMLButtonElement | null>(null)
async function ouvrirPleinEcran() {
  pleinEcran.value = true
  await nextTick()
  // showModal rend le reste de la page inerte (piège à focus natif) ; absent de certains environnements de test.
  if (typeof dialogue.value?.showModal === 'function') dialogue.value.showModal()
  boutonFermer.value?.focus()
}
async function fermerPleinEcran() {
  if (!pleinEcran.value) return
  pleinEcran.value = false
  await nextTick()
  boutonOuvrir.value?.focus()
}
</script>

<template>
  <section class="fin-mission">
    <h2 ref="titre" tabindex="-1">Mission terminée !</h2>

    <h3>Tes badges</h3>
    <ul class="badges">
      <li v-for="b in badges" :key="b" class="carte badge">
        <Award aria-hidden="true" /> <strong>{{ BADGES[b].titre }}</strong> : {{ BADGES[b].description }}
      </li>
    </ul>

    <section v-if="surprise" class="carte surprise">
      <h3>Le message piège était…</h3>
      <p><strong>{{ surprise.notification.de }}</strong> : « {{ surprise.notification.texte }} »</p>
      <p>{{ surprise.notification.explication }}</p>
      <p>{{ MESSAGES_SURPRISE[surprise.resultat] }}</p>
    </section>

    <section v-if="aRetenir.length">
      <h3>Ce que tu retiens</h3>
      <ul>
        <li v-for="s in aRetenir" :key="s.id">{{ t(s.aRetenir, s.aRetenirSimple) }}</li>
      </ul>
    </section>

    <section class="debrief">
      <h3>On en parle ?</h3>
      <ol>
        <li v-for="q in mission.debrief.questions" :key="q">{{ q }}</li>
      </ol>
      <button ref="boutonOuvrir" type="button" class="btn" @click="ouvrirPleinEcran">Afficher les questions en grand</button>
    </section>

    <div class="actions">
      <button type="button" class="btn" @click="emit('rejouer')">Rejouer la mission</button>
      <RouterLink class="btn btn-primaire" to="/carte">Retour à la carte</RouterLink>
    </div>

    <dialog
      v-if="pleinEcran"
      ref="dialogue"
      class="plein-ecran"
      aria-label="Questions de débrief"
      @keydown.esc.prevent="fermerPleinEcran"
      @cancel.prevent="fermerPleinEcran"
    >
      <ol>
        <li v-for="q in mission.debrief.questions" :key="q">{{ q }}</li>
      </ol>
      <button ref="boutonFermer" type="button" class="btn btn-primaire" @click="fermerPleinEcran">Fermer</button>
    </dialog>
  </section>
</template>

<style scoped>
.badges { list-style: none; padding: 0; display: grid; gap: 0.5rem; }
.badge { display: flex; align-items: center; gap: 0.5rem; }
.surprise { margin: 1rem 0; border-left: 6px solid var(--aide); }
.plein-ecran {
  position: fixed; inset: 0; z-index: 20; background: var(--surface);
  width: 100%; height: 100%; max-width: none; max-height: none; margin: 0; border: 0; color: var(--texte);
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  padding: 2rem; font-size: 2rem; gap: 2rem;
}
</style>
