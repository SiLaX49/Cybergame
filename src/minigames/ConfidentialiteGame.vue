<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { ConfidentialiteConfig } from '@/content/schema'
import { focusAuChangement } from '@/ui/focus'

type Reglage = ConfidentialiteConfig['reglages'][number]

const props = defineProps<{ config: ConfidentialiteConfig }>()
const emit = defineEmits<{ termine: [resultat: { reussites: number; erreurs: number }] }>()

const choix = reactive<Record<string, string>>(Object.fromEntries(props.config.reglages.map((r) => [r.id, r.initial])))
const verifie = ref(false)
const bilan = ref<HTMLElement | null>(null)
focusAuChangement(() => verifie.value, bilan)

const juste = (r: Reglage) => choix[r.id] === r.conseille
const reussites = computed(() => props.config.reglages.filter(juste).length)
const total = computed(() => props.config.reglages.length)
const libelleConseille = (r: Reglage) => r.options.find((o) => o.id === r.conseille)?.libelle ?? ''
const phraseBilan = computed(() =>
  reussites.value > 1
    ? `${reussites.value} réglages sur ${total.value} sont sûrs.`
    : `${reussites.value} réglage sur ${total.value} est sûr.`,
)
</script>

<template>
  <div class="confidentialite">
    <p>{{ config.consigne }}</p>
    <!-- Reçoit le focus avant les explications ; pas de role="status" pour éviter une double annonce. -->
    <p v-if="verifie" ref="bilan" class="bilan" tabindex="-1">{{ phraseBilan }} Les explications sont sous chaque réglage.</p>
    <div class="carte parametres">
      <p><strong>Paramètres · {{ config.appNom }}</strong></p>
      <fieldset v-for="r in config.reglages" :key="r.id">
        <legend>{{ r.libelle }}</legend>
        <label v-for="o in r.options" :key="o.id" class="option">
          <input v-model="choix[r.id]" type="radio" :name="`reglage-${r.id}`" :value="o.id" :disabled="verifie" />
          {{ o.libelle }}
        </label>
        <template v-if="verifie">
          <p v-if="juste(r)" class="verdict bon"><span aria-hidden="true">✅</span> Bon réglage. {{ r.explication }}</p>
          <p v-else class="verdict risque">
            <span aria-hidden="true">⚠️</span> À revoir : choisis « {{ libelleConseille(r) }} ». {{ r.explication }}
          </p>
        </template>
      </fieldset>
    </div>
    <div class="actions">
      <button v-if="!verifie" type="button" class="btn btn-primaire" @click="verifie = true">Vérifier mon profil</button>
      <button
        v-else
        type="button"
        class="btn btn-primaire"
        @click="emit('termine', { reussites, erreurs: total - reussites })"
      >
        Terminer le mini-jeu
      </button>
    </div>
  </div>
</template>

<style scoped>
.verdict.bon { color: var(--bon); }
.verdict.risque { color: var(--risque); }
</style>
