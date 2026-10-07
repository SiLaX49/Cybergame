<script setup lang="ts">
import { computed } from 'vue'
import type { Leviers, Scenario } from '@/content/schema'
import type { ScenarioResultat } from '@/engine/mission-runner'
import { ordreAffichage } from '@/engine/ordre'
import { useTexte } from '@/ui/useTexte'
import { reponseLevier, titreReponse, VERDICTS } from './reponseLevier'

const props = withDefaults(defineProps<{ scenario: Scenario; resultat: ScenarioResultat; leviers: Leviers; sensible?: boolean }>(), { sensible: false })
const emit = defineEmits<{ continuer: []; rejouer: [] }>()
const t = useTexte()

const indices = computed(() => ordreAffichage(props.scenario.indices, props.scenario.id))
const choix = computed(() => props.scenario.choix.find((c) => c.id === props.resultat.choixId))

const reponse = computed(() => reponseLevier(props.scenario.pourquoi, props.resultat.levier, props.leviers, props.sensible))
</script>

<template>
  <section v-if="choix" class="consequence">
    <p class="verdict" :class="choix.qualite">
      <span aria-hidden="true">{{ VERDICTS[choix.qualite].icone }}</span> <strong>{{ VERDICTS[choix.qualite].titre }}</strong>
    </p>
    <p><strong>Ton choix :</strong> {{ choix.texte }}</p>
    <p>{{ t(choix.consequence, choix.consequenceSimple) }}</p>
    <div v-if="reponse" class="ce-qui-a-marche" role="note">
      <h3>{{ titreReponse(sensible) }}</h3>
      <p>Tu as répondu : « {{ reponse.libelle }} »</p>
      <p>{{ reponse.truc }}</p>
      <p><strong>Ta parade :</strong> {{ reponse.parade }}</p>
    </div>
    <h3>Les indices</h3>
    <ul class="liste-indices">
      <li v-for="i in indices" :key="i.id">
        <strong>{{ i.pertinent ? 'Vrai indice' : 'Pas un indice' }} :</strong> {{ i.libelle }}
        <span v-if="resultat.indicesChoisis.includes(i.id)" class="coche"> (tu l’avais coché)</span>
      </li>
    </ul>
    <p>{{ scenario.explicationIndices }}</p>
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
.coche { color: var(--texte-doux); }
.a-retenir { background: #eef0ff; border-left: 6px solid var(--primaire); padding: 0.5rem 1rem; border-radius: var(--rayon); }
.ce-qui-a-marche { background: #fff8e6; border-left: 6px solid var(--aide); padding: 0.5rem 1rem; border-radius: var(--rayon); }
</style>
