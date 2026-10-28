<script setup lang="ts">
import { computed } from 'vue'
import type { Leviers, Qualite, Scenario } from '@/content/schema'
import type { ScenarioResultat } from '@/engine/mission-runner'
import { useTexte } from '@/ui/useTexte'
import ExplicationPanel from './ExplicationPanel.vue'
import { reponseLevier, titreReponse, verdict } from './reponseLevier'

/** `indices` : la liste passée au téléphone (même ordre, donc mêmes numéros). */
const props = withDefaults(
  defineProps<{ scenario: Scenario; resultat: ScenarioResultat; leviers: Leviers; indices: Scenario['indices']; sensible?: boolean }>(),
  { sensible: false },
)
const emit = defineEmits<{ continuer: []; rejouer: [] }>()
const t = useTexte()

/** En thème sensible, le rouge vif d’un « risque » est remplacé par un encadré doux ; sur un message vrai, par un encadré d’information. */
function classeEncadre(qualite: Qualite): string {
  if (qualite === 'risque' && props.scenario.fiable) return 'encadre-info'
  return props.sensible && qualite === 'risque' ? 'encadre-doux' : `encadre-${qualite}`
}

const choix = computed(() => props.scenario.choix.find((c) => c.id === props.resultat.choixId))
// Un piège suivi de la question des leviers a déjà montré l’explication en phase « pourquoi ».
const explicationVue = computed(() => choix.value?.qualite === 'risque' && Boolean(props.scenario.pourquoi))

const reponse = computed(() => reponseLevier(props.scenario.pourquoi, props.resultat.levier, props.leviers, props.sensible))
</script>

<template>
  <section v-if="choix" class="consequence">
    <p class="verdict encadre" :class="[choix.qualite, classeEncadre(choix.qualite)]">
      <span aria-hidden="true">{{ verdict(choix.qualite, scenario.fiable).icone }}</span> <strong>{{ verdict(choix.qualite, scenario.fiable).titre }}</strong>
    </p>
    <p><strong>Ton choix :</strong> {{ choix.texte }}</p>
    <p>{{ t(choix.consequence, choix.consequenceSimple) }}</p>
    <div v-if="reponse" class="ce-qui-a-marche encadre encadre-info" role="note">
      <h3>{{ titreReponse(sensible) }}</h3>
      <p>Tu as répondu : « {{ reponse.libelle }} »</p>
      <p>{{ reponse.truc }}</p>
      <p><strong>Ta parade :</strong> {{ reponse.parade }}</p>
    </div>
    <ExplicationPanel v-if="!explicationVue" :indices="indices" :explication="scenario.explicationIndices" :fiable="scenario.fiable" />
    <div class="a-retenir encadre encadre-info" role="note">
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
.consequence, .reaction { display: grid; gap: 0.9rem; }
.consequence > *, .reaction > * { margin-top: 0; margin-bottom: 0; }
.verdict { font-size: 1.15em; }
.encadre h3 { margin: 0 0 0.35rem; }
</style>
