<script setup lang="ts">
import { Award } from '@lucide/vue'
import { computed, nextTick, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Leviers, Lieu, Mission, Scenario } from '@/content/schema'
import { BADGES, calculerBadges, descriptionBadge } from '@/engine/badges'
import { leviersDeLaMission, leviersDuRun, type RunState, type SurpriseResultat } from '@/engine/mission-runner'
import { focusAuMontage } from '@/ui/focus'
import Hulotte from '@/ui/Hulotte.vue'
import { useTexte } from '@/ui/useTexte'
import { FIN_SENSIBLE } from './textesSensibles'

const props = withDefaults(defineProps<{ mission: Mission; etat: RunState; leviers: Leviers; sensible?: boolean }>(), { sensible: false })
const emit = defineEmits<{ rejouer: [] }>()
const t = useTexte()
const titre = ref<HTMLElement | null>(null)
focusAuMontage(titre)

const badges = computed(() => calculerBadges(props.etat))
const leviersChoisis = computed(() =>
  leviersDuRun(props.mission, props.etat).map((id) =>
    id === 'autre'
      ? { id, libelle: props.leviers.autre.libelle, parade: (props.sensible ? props.leviers.autreSensible : props.leviers.autre).parade }
      : { id, libelle: props.leviers.leviers[id].libelle, parade: props.leviers.leviers[id].parade },
  ),
)
const aSurveiller = computed(() => leviersDeLaMission(props.mission).map((id) => props.leviers.leviers[id].libelle))
/** Tous les scénarios ont été passés : on ne peut rien dire de ce qui a marché ou non. */
const avecChoix = computed(() =>
  props.mission.etapes.filter((e): e is Scenario | Lieu => e.type === 'scenario' || e.type === 'lieu'),
)
const estPasse = (id: string) => {
  const r = props.etat.resultats[id]
  return (r?.type === 'scenario' || r?.type === 'lieu') && r.passe
}
const toutPasse = computed(() => avecChoix.value.every((s) => estPasse(s.id)))
const afficherCraquer = computed(
  () => leviersChoisis.value.length > 0 || (aSurveiller.value.length > 0 && !toutPasse.value),
)
const aRetenir = computed(() =>
  avecChoix.value.filter((s) => {
    const r = props.etat.resultats[s.id]
    return (r?.type === 'scenario' || r?.type === 'lieu') && !r.passe
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
    <header class="fin-entete">
      <Hulotte :expression="sensible ? 'douce' : 'bravo'" :taille="120" />
      <h2 ref="titre" tabindex="-1">Mission terminée !</h2>
    </header>

    <h3>Tes badges</h3>
    <ul class="badges" :class="{ 'badges-animes': !sensible }">
      <li v-for="b in badges" :key="b" class="badge medaille">
        <Award aria-hidden="true" /> <strong>{{ BADGES[b].titre }}</strong> : {{ descriptionBadge(b, sensible) }}
      </li>
    </ul>

    <section v-if="afficherCraquer" class="encadre encadre-aide craquer">
      <h3>{{ sensible ? FIN_SENSIBLE.titre : 'Ce qui t’a fait craquer' }}</h3>
      <ul v-if="leviersChoisis.length">
        <li v-for="l in leviersChoisis" :key="l.id"><strong>{{ l.libelle }}</strong> : {{ l.parade }}</li>
      </ul>
      <template v-else>
        <p v-if="sensible">{{ FIN_SENSIBLE.sansLevier }}</p>
        <p v-else>Aucun piège n’a marché sur toi cette fois. Les leviers à surveiller :</p>
        <ul>
          <li v-for="l in aSurveiller" :key="l">{{ l }}</li>
        </ul>
      </template>
    </section>

    <section v-if="surprise" class="encadre encadre-info surprise">
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
.fin-mission { display: grid; gap: 1rem; }
.fin-mission > * { margin-top: 0; margin-bottom: 0; }
.fin-entete { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.fin-entete h2 { margin: 0; }
.badges { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.6rem; }
/* Médailles : le texte du badge reste entier, l'icône n'est qu'un décor. */
.medaille {
  display: flex; align-items: flex-start; gap: 0.6rem; border-radius: 18px;
  font-size: 1em; padding: 0.4em 0.9em; border-width: 2px; border-color: var(--primaire);
  box-shadow: 0 3px 0 var(--bord-fort);
}
.medaille svg { flex: none; margin-top: 0.15em; color: var(--primaire); }
/* Apparition douce : jamais en thème sensible (classe absente), coupée par les réglages globaux d'animation. */
.badges-animes .medaille { animation: medaille-apparait var(--duree) ease-out both; }
@keyframes medaille-apparait { from { transform: translateY(6px); } to { transform: none; } }
.debrief ol { padding-left: 1.4rem; }
.plein-ecran {
  position: fixed; inset: 0; z-index: 20; background: var(--surface);
  width: 100%; height: 100%; max-width: none; max-height: none; margin: 0; border: 0; color: var(--texte);
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  padding: 2rem; font-size: 2rem; gap: 2rem;
}
</style>
