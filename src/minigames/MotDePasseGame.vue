<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MotdepasseConfig } from '@/content/schema'
import { focusAuChangement } from '@/ui/focus'
import { atteint, evaluerRobustesse, EXEMPLE_PHRASE, LIBELLES_NIVEAU, NIVEAUX } from './robustesse'

const props = defineProps<{ config: MotdepasseConfig }>()
const emit = defineEmits<{ termine: [resultat: { reussites: number; erreurs: number }] }>()

const mdp = ref('')
const passe = ref(false)
const boutonTerminer = ref<HTMLElement | null>(null)
focusAuChangement(() => passe.value, boutonTerminer)

const evaluation = computed(() => evaluerRobustesse(mdp.value, props.config.interdits))
const objectifAtteint = computed(() => atteint(evaluation.value.niveau, props.config.objectif))
const rang = computed(() => NIVEAUX.indexOf(evaluation.value.niveau))
</script>

<template>
  <div class="motdepasse">
    <p>{{ config.consigne }}</p>
    <p class="contexte">{{ config.contexte }}</p>
    <p class="avertissement"><strong>N’écris pas ton vrai mot de passe :</strong> c’est un jeu.</p>
    <p>Objectif : un mot de passe {{ LIBELLES_NIVEAU[config.objectif].toLowerCase() }}.</p>
    <template v-if="!passe">
      <label for="phrase-de-passe">Ta phrase de passe</label>
      <input
        id="phrase-de-passe"
        v-model="mdp"
        type="text"
        autocomplete="off"
        spellcheck="false"
        aria-describedby="robustesse-mdp conseils-mdp"
      />
      <p id="robustesse-mdp" role="status">
        Robustesse : <strong>{{ LIBELLES_NIVEAU[evaluation.niveau] }}</strong> · temps estimé pour la deviner :
        {{ evaluation.temps }}
      </p>
      <meter aria-hidden="true" min="0" max="4" :value="rang" />
      <ul id="conseils-mdp" class="conseils">
        <li v-for="c in evaluation.conseils" :key="c.id">
          <span aria-hidden="true">{{ c.ok ? '✅' : '⬜' }}</span> {{ c.libelle }} ({{ c.ok ? 'fait' : 'à faire' }})
        </li>
      </ul>
      <div class="actions">
        <button
          type="button"
          class="btn btn-primaire"
          :disabled="!objectifAtteint"
          @click="emit('termine', { reussites: 1, erreurs: 0 })"
        >
          Valider mon mot de passe
        </button>
        <button type="button" class="btn" @click="passe = true">Je passe</button>
      </div>
    </template>
    <template v-else>
      <p>
        Un exemple de phrase de passe très solide : <strong>{{ EXEMPLE_PHRASE }}</strong>. Plusieurs mots au hasard, faciles à
        retenir, difficiles à deviner.
      </p>
      <button ref="boutonTerminer" type="button" class="btn btn-primaire" @click="emit('termine', { reussites: 0, erreurs: 1 })">
        Terminer le mini-jeu
      </button>
    </template>
  </div>
</template>

<style scoped>
.avertissement { background: #fff8e6; border-left: 4px solid var(--aide); padding: 0.4rem 0.8rem; }
input { font: inherit; min-height: 44px; width: 100%; max-width: 32rem; display: block; margin: 0.3rem 0 0.6rem; }
meter { width: 100%; max-width: 32rem; height: 1rem; }
.conseils { list-style: none; padding: 0; }
</style>
