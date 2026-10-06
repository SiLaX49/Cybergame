<script setup lang="ts">
import { computed } from 'vue'
import type { Leviers, Scenario } from '@/content/schema'
import type { ScenarioResultat } from '@/engine/mission-runner'
import { useTexte } from '@/ui/useTexte'
import ExplicationPanel from './ExplicationPanel.vue'
import { reponseLevier, VERDICTS } from './reponseLevier'

/** `indices` : la liste passée au téléphone (même ordre, donc mêmes numéros). */
const props = defineProps<{ scenario: Scenario; resultat: ScenarioResultat; leviers: Leviers; indices: Scenario['indices'] }>()
const emit = defineEmits<{ continuer: []; rejouer: [] }>()
const t = useTexte()

const choix = computed(() => props.scenario.choix.find((c) => c.id === props.resultat.choixId))
// Un piège suivi de la question des leviers a déjà montré l’explication en phase « pourquoi ».
const explicationVue = computed(() => choix.value?.qualite === 'risque' && Boolean(props.scenario.pourquoi))

const reponse = computed(() => reponseLevier(props.scenario.pourquoi, props.resultat.levier, props.leviers))
</script>

<template>
  <section v-if="choix" class="consequence">
    <p class="verdict" :class="choix.qualite">
      <span aria-hidden="true">{{ VERDICTS[choix.qualite].icone }}</span> <strong>{{ VERDICTS[choix.qualite].titre }}</strong>
    </p>
    <p><strong>Ton choix :</strong> {{ choix.texte }}</p>
    <p>{{ t(choix.consequence, choix.consequenceSimple) }}</p>
    <div v-if="reponse" class="ce-qui-a-marche" role="note">
      <h3>Ce qui a marché sur toi</h3>
      <p>Tu as répondu : « {{ reponse.libelle }} »</p>
      <p>{{ reponse.truc }}</p>
      <p><strong>Ta parade :</strong> {{ reponse.parade }}</p>
    </div>
    <ExplicationPanel v-if="!explicationVue" :indices="indices" :explication="scenario.explicationIndices" />
    <div class="a-retenir" role="note">
      <h3>À retenir</h3>
      <p>{{ t(scenario.aRetenir, scenario.aRetenirSimple) }}</p>
    </div>
    <div class="actions">
      <button type="button" class="btn" @click="emit('rejouer')">Rejouer ce scénario</button>
      <button type="button" class="btn btn-primaire" @click="emit('continuer')">Continuer</button>
    </div>
  </section>
</template>

<style scoped>
.verdict { font-size: 1.15em; }
.verdict.bon { color: var(--bon); }
.verdict.risque { color: var(--risque); }
.verdict.aide { color: var(--aide); }
.a-retenir { background: #eef0ff; border-left: 6px solid var(--primaire); padding: 0.5rem 1rem; border-radius: var(--rayon); }
.ce-qui-a-marche { background: #fff8e6; border-left: 6px solid var(--aide); padding: 0.5rem 1rem; border-radius: var(--rayon); }
</style>
