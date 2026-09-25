<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref } from 'vue'
import type { TriConfig } from '@/content/schema'

const props = defineProps<{ config: TriConfig; chrono: boolean }>()
const emit = defineEmits<{ termine: [resultat: { reussites: number; erreurs: number }] }>()

const DUREE = 20
const TEMPS_ECOULE = '__temps__' // ne peut pas être un identifiant de catégorie (pas de « _ » dans les slugs)

const index = ref(0)
const reponse = ref<string | null>(null)
const reussites = ref(0)
const erreurs = ref(0)
const restant = ref(DUREE)
let minuteur: ReturnType<typeof setInterval> | undefined
const carteTri = ref<HTMLElement | null>(null)
const boutonSuivant = ref<HTMLElement | null>(null)

const carte = computed(() => props.config.cartes[index.value]!)
const categorieJuste = computed(() => props.config.categories.find((c) => c.id === carte.value.categorie)!)
const derniere = computed(() => index.value === props.config.cartes.length - 1)

function arreterChrono() {
  clearInterval(minuteur)
  minuteur = undefined
}
function demarrerChrono() {
  arreterChrono()
  if (!props.chrono) return
  restant.value = DUREE
  minuteur = setInterval(() => {
    restant.value -= 1
    if (restant.value <= 0) repondre(TEMPS_ECOULE)
  }, 1000)
}
function repondre(id: string) {
  if (reponse.value !== null) return
  arreterChrono()
  reponse.value = id
  if (id === carte.value.categorie) reussites.value += 1
  else erreurs.value += 1
  // Le bouton de catégorie cliqué devient inactif : le focus passe au bouton « Suivant ».
  void nextTick(() => boutonSuivant.value?.focus())
}
function suivant() {
  if (derniere.value) {
    emit('termine', { reussites: reussites.value, erreurs: erreurs.value })
    return
  }
  index.value += 1
  reponse.value = null
  demarrerChrono()
  void nextTick(() => carteTri.value?.focus())
}

demarrerChrono()
onUnmounted(arreterChrono)
</script>

<template>
  <div class="tri">
    <p>{{ config.consigne }}</p>
    <p class="compteur">Carte {{ index + 1 }} sur {{ config.cartes.length }}</p>
    <p v-if="chrono && reponse === null" class="chrono" role="timer" aria-live="off">
      <span aria-hidden="true">⏱️</span> {{ restant }} s
    </p>
    <blockquote ref="carteTri" class="carte carte-tri" tabindex="-1">{{ carte.texte }}</blockquote>
    <div class="tri-categories actions" role="group" aria-label="Choisis une catégorie">
      <button
        v-for="c in config.categories"
        :key="c.id"
        type="button"
        class="btn"
        :disabled="reponse !== null"
        @click="repondre(c.id)"
      >
        {{ c.libelle }}
      </button>
    </div>
    <div class="retour" role="status">
      <template v-if="reponse !== null">
        <p v-if="reponse === carte.categorie"><span aria-hidden="true">✅</span> Bien vu !</p>
        <p v-else-if="reponse === TEMPS_ECOULE">
          <span aria-hidden="true">⏱️</span> Temps écoulé : c’était « {{ categorieJuste.libelle }} ».
        </p>
        <p v-else><span aria-hidden="true">❌</span> Pas tout à fait : c’était « {{ categorieJuste.libelle }} ».</p>
        <p>{{ carte.explication }}</p>
      </template>
    </div>
    <button v-if="reponse !== null" ref="boutonSuivant" type="button" class="btn btn-primaire" @click="suivant">
      {{ derniere ? 'Terminer le mini-jeu' : 'Suivant' }}
    </button>
  </div>
</template>

<style scoped>
.carte-tri { margin: 1rem 0; font-size: 1.1em; }
.chrono { font-weight: 700; }
</style>
