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
const couleurJauge = computed(() => (rang.value <= 1 ? 'var(--risque)' : rang.value === 2 ? 'var(--aide)' : 'var(--bon)'))
</script>

<template>
  <div class="motdepasse carte">
    <p class="consigne">{{ config.consigne }}</p>
    <p class="contexte encadre encadre-info">{{ config.contexte }}</p>
    <p class="avertissement encadre encadre-aide"><strong>N’écris pas ton vrai mot de passe :</strong> c’est un jeu.</p>
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
      <div class="jauge-bloc" aria-hidden="true">
        <label for="jauge-mdp">Niveau de robustesse</label>
        <progress id="jauge-mdp" class="jauge" max="4" :value="rang" :style="{ '--accent': couleurJauge }" />
        <span class="jauge-niveau">{{ LIBELLES_NIVEAU[evaluation.niveau] }}</span>
      </div>
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
        Un exemple de phrase de passe très solide : <strong>{{ EXEMPLE_PHRASE }}</strong> (ne la réutilise pas : elle est publique).
        Plusieurs mots au hasard, faciles à retenir, difficiles à deviner.
      </p>
      <button ref="boutonTerminer" type="button" class="btn btn-primaire" @click="emit('termine', { reussites: 0, erreurs: 1 })">
        Terminer le mini-jeu
      </button>
    </template>
  </div>
</template>

<style scoped>
.consigne { color: var(--texte-doux); }
.encadre { margin: 0.75rem 0; }
input {
  font: inherit; min-height: 48px; width: 100%; max-width: 32rem; display: block; margin: 0.3rem 0 0.6rem;
  padding: 0.4rem 0.8rem; color: var(--texte); background: var(--surface);
  border: 2px solid var(--bord-fort); border-radius: var(--rayon-btn);
}
.jauge-bloc { display: grid; grid-template-columns: 1fr auto; gap: 0.2rem 0.75rem; align-items: center; max-width: 32rem; }
.jauge-bloc label { grid-column: 1 / -1; font-weight: 600; color: var(--texte-doux); }
.jauge { height: 1.1rem; }
.jauge-niveau { font-family: var(--police-titres); font-weight: 600; min-width: 5.5rem; text-align: right; }
.conseils { list-style: none; padding: 0; }
.conseils li { padding: 0.15rem 0; }
</style>
