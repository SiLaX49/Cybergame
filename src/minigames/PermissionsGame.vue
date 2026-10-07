<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import type { PermissionsConfig } from '@/content/schema'

type Decision = 'autoriser' | 'refuser'
type Permission = PermissionsConfig['apps'][number]['permissions'][number]

const props = defineProps<{ config: PermissionsConfig }>()
const emit = defineEmits<{ termine: [resultat: { reussites: number; erreurs: number }] }>()

const index = ref(0)
const decisions = reactive<Record<string, Decision>>({})
const valide = ref(false)
const reussites = ref(0)
const erreurs = ref(0)
const titre = ref<HTMLElement | null>(null)
const bilan = ref<HTMLElement | null>(null)
// Un seul observateur : « Appli suivante » change index et valide dans le même tick.
watch([index, valide], async ([, estValide]) => {
  await nextTick()
  ;(estValide ? bilan : titre).value?.focus()
})

const app = computed(() => props.config.apps[index.value]!)
const derniere = computed(() => index.value === props.config.apps.length - 1)
const cle = (p: Permission) => `${app.value.id}-${p.id}`
const juste = (p: Permission) => (decisions[cle(p)] === 'autoriser') === p.necessaire
const complet = computed(() => app.value.permissions.every((p) => decisions[cle(p)]))
const phraseBilan = computed(() => {
  const justes = app.value.permissions.filter(juste).length
  const total = app.value.permissions.length
  return justes > 1 ? `${justes} décisions justes sur ${total}.` : `${justes} décision juste sur ${total}.`
})

function valider() {
  if (!complet.value || valide.value) return
  for (const p of app.value.permissions) {
    if (juste(p)) reussites.value += 1
    else erreurs.value += 1
  }
  valide.value = true
}
function suivante() {
  index.value += 1
  valide.value = false
}
</script>

<template>
  <div class="permissions">
    <p class="consigne">{{ config.consigne }}</p>
    <div class="carte appli">
      <h3 ref="titre" tabindex="-1">Appli {{ index + 1 }} sur {{ config.apps.length }} : {{ app.nom }}</h3>
      <p>{{ app.description }}</p>
      <!-- Reçoit le focus avant les explications ; pas de role="status" pour éviter une double annonce. -->
      <p v-if="valide" ref="bilan" class="bilan encadre encadre-info" tabindex="-1">{{ phraseBilan }} Les explications sont sous chaque permission.</p>
      <fieldset v-for="p in app.permissions" :key="cle(p)">
        <legend>{{ app.nom }} veut : {{ p.libelle }}</legend>
        <label class="option">
          <input v-model="decisions[cle(p)]" type="radio" :name="`perm-${cle(p)}`" value="autoriser" :disabled="valide" />
          Autoriser
        </label>
        <label class="option">
          <input v-model="decisions[cle(p)]" type="radio" :name="`perm-${cle(p)}`" value="refuser" :disabled="valide" />
          Refuser
        </label>
        <p v-if="valide" class="verdict encadre" :class="juste(p) ? 'encadre-bon' : 'encadre-risque'">
          <span aria-hidden="true">{{ juste(p) ? '✅' : '⚠️' }}</span>
          {{ juste(p) ? 'Bien décidé' : p.necessaire ? 'À autoriser' : 'À refuser' }} : {{ p.explication }}
        </p>
      </fieldset>
    </div>
    <div class="actions">
      <button v-if="!valide" type="button" class="btn btn-primaire" :disabled="!complet" @click="valider">
        Valider les permissions
      </button>
      <button v-else-if="!derniere" type="button" class="btn btn-primaire" @click="suivante">Appli suivante</button>
      <button v-else type="button" class="btn btn-primaire" @click="emit('termine', { reussites, erreurs })">
        Terminer le mini-jeu
      </button>
    </div>
  </div>
</template>

<style scoped>
.consigne { color: var(--texte-doux); }
.verdict { margin: 0.6rem 0 0; }
.bilan { margin: 0.75rem 0; }
</style>
