<script setup lang="ts">
import { computed } from 'vue'
import type { Leviers, Lieu } from '@/content/schema'
import type { LieuResultat } from '@/engine/mission-runner'
import { useTexte } from '@/ui/useTexte'
import { reponseLevier, titreReponse, VERDICTS } from './reponseLevier'

const props = withDefaults(defineProps<{ lieu: Lieu; resultat: LieuResultat; leviers: Leviers; sensible?: boolean }>(), { sensible: false })
const emit = defineEmits<{ continuer: []; rejouer: [] }>()
const t = useTexte()

const choix = computed(() => props.lieu.choix.find((c) => c.id === props.resultat.choixId))
const risque = computed(() => choix.value?.qualite === 'risque')
const recupSuit = computed(
  () => !!props.lieu.recuperation && !!choix.value && props.lieu.recuperation.siChoix.includes(choix.value.id),
)
const reponse = computed(() => reponseLevier(props.lieu.pourquoi, props.resultat.levier, props.leviers, props.sensible))
</script>

<template>
  <section v-if="choix" class="reaction">
    <p class="verdict" :class="choix.qualite">
      <span aria-hidden="true">{{ VERDICTS[choix.qualite].icone }}</span> <strong>{{ VERDICTS[choix.qualite].titre }}</strong>
    </p>
    <p v-if="risque" class="deplacement">
      <strong>Tu restes sur ta plateforme.</strong> Dans la vraie vie, on ne revient pas en arrière ; ici, tu peux rejouer ce moment.
    </p>
    <p v-else class="deplacement"><strong>Tu avances !</strong></p>
    <p><strong>Ton choix :</strong> {{ choix.texte }}</p>
    <p>{{ t(choix.reaction, choix.reactionSimple) }}</p>
    <div v-if="reponse" class="ce-qui-a-marche" role="note">
      <h3>{{ titreReponse(sensible) }}</h3>
      <p>Tu as répondu : « {{ reponse.libelle }} »</p>
      <p>{{ reponse.truc }}</p>
      <p><strong>Ta parade :</strong> {{ reponse.parade }}</p>
    </div>
    <div class="a-retenir" role="note">
      <h3>À retenir</h3>
      <p>{{ t(lieu.aRetenir, lieu.aRetenirSimple) }}</p>
    </div>
    <div class="actions">
      <template v-if="risque">
        <button v-if="recupSuit" type="button" class="btn btn-primaire" @click="emit('continuer')">Continuer</button>
        <button v-else type="button" class="btn btn-primaire" @click="emit('rejouer')">Réessayer</button>
      </template>
      <template v-else>
        <button type="button" class="btn" @click="emit('rejouer')">Rejouer ce lieu</button>
        <button type="button" class="btn btn-primaire" @click="emit('continuer')">Continuer</button>
      </template>
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
