<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { PermissionsConfig } from '@/content/schema'
import { focusAuChangement } from '@/ui/focus'

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
focusAuChangement(() => index.value, titre)
focusAuChangement(() => valide.value, bilan)

const app = computed(() => props.config.apps[index.value]!)
const derniere = computed(() => index.value === props.config.apps.length - 1)
const cle = (p: Permission) => `${app.value.id}-${p.id}`
const juste = (p: Permission) => (decisions[cle(p)] === 'autoriser') === p.necessaire
const complet = computed(() => app.value.permissions.every((p) => decisions[cle(p)]))

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
    <p>{{ config.consigne }}</p>
    <div class="carte appli">
      <h3 ref="titre" tabindex="-1">Appli {{ index + 1 }} sur {{ config.apps.length }} : {{ app.nom }}</h3>
      <p>{{ app.description }}</p>
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
        <p v-if="valide" class="verdict" :class="juste(p) ? 'bon' : 'risque'">
          <span aria-hidden="true">{{ juste(p) ? '✅' : '⚠️' }}</span>
          {{ juste(p) ? 'Bien décidé' : p.necessaire ? 'À autoriser' : 'À refuser' }} : {{ p.explication }}
        </p>
      </fieldset>
    </div>
    <p ref="bilan" role="status" tabindex="-1">{{ valide ? 'Décisions vérifiées.' : '' }}</p>
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
.verdict.bon { color: var(--bon); }
.verdict.risque { color: var(--risque); }
</style>
