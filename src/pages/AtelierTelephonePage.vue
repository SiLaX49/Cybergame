<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import type { FilAction, Fil, Scenario } from '@/content/schema'
import { toutesLesMissions } from '@/content'
import SceneTelephone from '@/phone/SceneTelephone.vue'
import type { Scene } from '@/phone/scene'
import type { EcranTelephone } from '@/phone/types'
import type { Mode } from '@/store/progress'
import { useProgress } from '@/store/useProgress'

/** Atelier : chaque faux écran du contenu réel, joué seul, pour revoir le téléphone hors mission. */
type Entree = { id: string; libelle: string; scenario?: Scenario; fil?: Fil }

const entrees: Entree[] = toutesLesMissions().flatMap((m) =>
  m.etapes.flatMap((e): Entree[] => {
    if (e.type === 'scenario') return [{ id: `${m.id}/${e.id}`, libelle: `${e.ecran.app} · ${m.titre} · ${e.id}`, scenario: e }]
    if (e.type === 'fil') return [{ id: `${m.id}/${e.id}`, libelle: `verrouillage · ${m.titre}`, fil: e }]
    return []
  }),
)
const apps = [...new Set(entrees.map((e) => e.libelle.split(' · ')[0]!))]

const filtre = ref('tous')
const visibles = computed(() => entrees.filter((e) => filtre.value === 'tous' || e.libelle.startsWith(`${filtre.value} ·`)))
const choisie = ref(entrees[0]!.id)
const entree = computed(() => entrees.find((e) => e.id === choisie.value) ?? entrees[0]!)
const mode = ref<Mode>('solo')
const choixJoue = ref<string | null>(null)
const actionsNotif = reactive<Record<string, FilAction>>({})
const indiceVisible = ref(false)
/** Entrée par notification (écran verrouillé, puis accueil), comme dans une mission. */
const entreeNotif = ref(false)
const store = useProgress()
const indices = computed(() => entree.value.scenario?.indices ?? [])

const ecran = computed<EcranTelephone>(() =>
  entree.value.fil ? { app: 'verrouillage', notifications: entree.value.fil.notifications } : entree.value.scenario!.ecran,
)
const scene = computed<Scene>(() => ({
  ecran: ecran.value,
  choix: entree.value.scenario?.choix,
  mode: mode.value,
  graine: entree.value.scenario?.id ?? '',
  choixJoue: choixJoue.value,
  actionsNotif,
  indices: indices.value,
  indiceVisible: indiceVisible.value,
  entree: entreeNotif.value,
}))
function reinitialiser() {
  choixJoue.value = null
  indiceVisible.value = false
  for (const k of Object.keys(actionsNotif)) delete actionsNotif[k]
}
watch([choisie, filtre], reinitialiser)
/** Rejoue la séquence du dernier choix : un passage par l'attente, puis le même choix. */
async function rejouerSequence() {
  const id = choixJoue.value
  choixJoue.value = null
  await nextTick()
  choixJoue.value = id
}
watch(visibles, (v) => {
  if (!v.some((e) => e.id === choisie.value) && v[0]) choisie.value = v[0].id
})
</script>

<template>
  <main class="conteneur atelier">
    <h1>Atelier du téléphone</h1>
    <p>Tous les faux écrans du jeu, un par un. Rien n’est enregistré, sauf la case « Animations », qui change le réglage du jeu.</p>
    <div class="controles">
      <label>Appli
        <select v-model="filtre">
          <option value="tous">Toutes</option>
          <option v-for="a in apps" :key="a" :value="a">{{ a }}</option>
        </select>
      </label>
      <label>Écran
        <select v-model="choisie">
          <option v-for="e in visibles" :key="e.id" :value="e.id">{{ e.libelle }}</option>
        </select>
      </label>
      <label>Mode
        <select v-model="mode">
          <option value="solo">Solo</option>
          <option value="binome">Binôme</option>
          <option value="classe">Classe entière</option>
        </select>
      </label>
      <label class="case">
        <input type="checkbox" :checked="store.etat.reglages.animations" @change="store.modifierReglages({ animations: ($event.target as HTMLInputElement).checked })" />
        Animations
      </label>
      <label class="case">
        <input v-model="entreeNotif" type="checkbox" />
        Entrée par notification
      </label>
      <label class="case">
        <input v-model="indiceVisible" type="checkbox" :disabled="!entree.scenario || !!choixJoue" />
        Indice joué
      </label>
      <button type="button" class="btn" :disabled="!choixJoue" @click="rejouerSequence">Rejouer la séquence</button>
      <button type="button" class="btn" @click="reinitialiser">Réinitialiser</button>
    </div>
    <SceneTelephone :scene="scene" @choisir="(id) => (choixJoue = id)" @agir="(id, a) => (actionsNotif[id] = a)">
      <template #entete="{ idQuestion }">
        <h2 v-if="entree.scenario" :id="idQuestion">{{ entree.scenario.question }}</h2>
      </template>
      <section class="infos" aria-label="Ce que l’écran a reçu">
        <p v-if="choixJoue"><strong>Choix joué :</strong> {{ choixJoue }}</p>
        <p v-if="entree.fil"><strong>Actions :</strong> {{ Object.keys(actionsNotif).length }} sur {{ entree.fil.notifications.length }}</p>
      </section>
    </SceneTelephone>
  </main>
</template>

<style scoped>
.controles { display: flex; flex-wrap: wrap; gap: 1rem; align-items: end; margin-bottom: 1.5rem; }
.controles label { display: flex; flex-direction: column; gap: 0.25rem; font-weight: 700; }
.controles label.case { flex-direction: row; align-items: center; }
.controles select { max-width: 32rem; }
</style>
