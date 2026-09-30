<script setup lang="ts">
import { computed } from 'vue'
import type { Leviers, Qualite, Scenario } from '@/content/schema'
import type { ScenarioResultat } from '@/engine/mission-runner'
import { ordreAffichage } from '@/engine/ordre'
import { useTexte } from '@/ui/useTexte'

const props = defineProps<{ scenario: Scenario; resultat: ScenarioResultat; leviers: Leviers }>()
const emit = defineEmits<{ continuer: []; rejouer: [] }>()
const t = useTexte()

const indices = computed(() => ordreAffichage(props.scenario.indices, props.scenario.id))
const choix = computed(() => props.scenario.choix.find((c) => c.id === props.resultat.choixId))
const VERDICTS: Record<Qualite, { icone: string; titre: string }> = {
  bon: { icone: '✅', titre: 'Bon réflexe !' },
  aide: { icone: '🤝', titre: 'Demander de l’aide, c’est toujours une bonne idée.' },
  risque: { icone: '⚠️', titre: 'C’était risqué. Voyons ce qui se passe.' },
}

const reponse = computed(() => {
  const levier = props.resultat.levier
  if (!levier) return null
  if (levier === 'autre') return { libelle: props.leviers.autre.libelle, truc: props.leviers.autre.truc, parade: props.leviers.autre.parade }
  const p = props.scenario.pourquoi?.find((x) => x.levier === levier)
  return p ? { libelle: props.leviers.leviers[levier].libelle, truc: p.truc, parade: p.parade } : null
})
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
