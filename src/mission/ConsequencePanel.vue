<script setup lang="ts">
import { computed } from 'vue'
import type { Leviers, Qualite, Scenario } from '@/content/schema'
import type { ScenarioResultat } from '@/engine/mission-runner'
import { ordreAffichage } from '@/engine/ordre'
import { useTexte } from '@/ui/useTexte'
import { reponseLevier, titreReponse, VERDICTS } from './reponseLevier'

const props = withDefaults(defineProps<{ scenario: Scenario; resultat: ScenarioResultat; leviers: Leviers; sensible?: boolean }>(), { sensible: false })
const emit = defineEmits<{ continuer: []; rejouer: [] }>()
const t = useTexte()

/** En thème sensible, le rouge vif d’un « risque » est remplacé par un encadré doux (l’icône et le texte du verdict restent). */
function classeEncadre(qualite: Qualite): string {
  return props.sensible && qualite === 'risque' ? 'encadre-doux' : `encadre-${qualite}`
}

const indices = computed(() => ordreAffichage(props.scenario.indices, props.scenario.id))
const choix = computed(() => props.scenario.choix.find((c) => c.id === props.resultat.choixId))

const reponse = computed(() => reponseLevier(props.scenario.pourquoi, props.resultat.levier, props.leviers, props.sensible))
</script>

<template>
  <section v-if="choix" class="consequence">
    <p class="verdict encadre" :class="[choix.qualite, classeEncadre(choix.qualite)]">
      <span aria-hidden="true">{{ VERDICTS[choix.qualite].icone }}</span> <strong>{{ VERDICTS[choix.qualite].titre }}</strong>
    </p>
    <p><strong>Ton choix :</strong> {{ choix.texte }}</p>
    <p>{{ t(choix.consequence, choix.consequenceSimple) }}</p>
    <div v-if="reponse" class="ce-qui-a-marche encadre encadre-info" role="note">
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
.coche { color: var(--texte-doux); }
.encadre h3 { margin: 0 0 0.35rem; }
.liste-indices { margin: 0; padding-left: 1.2rem; }
</style>
