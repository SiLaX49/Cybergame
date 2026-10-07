<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { VERDICTS, type Verdict, type VerificationConfig } from '@/content/schema'
import { focusAuChangement } from '@/ui/focus'

const props = defineProps<{ config: VerificationConfig }>()
const emit = defineEmits<{ termine: [resultat: { reussites: number; erreurs: number }] }>()

const LIBELLES: Record<Verdict, string> = { fiable: 'Fiable', douteux: 'Douteux', faux: 'Faux' }
const revelees = ref<string[]>([])
const choisi = ref<Verdict | null>(null)
const resultat = ref<HTMLElement | null>(null)
focusAuChangement(() => choisi.value, resultat)

const juste = computed(() => choisi.value === props.config.verdict)

const annonce = ref('')

function enqueter(id: string) {
  if (!revelees.value.includes(id)) revelees.value.push(id)
  void annoncer(props.config.actions.find((a) => a.id === id)?.resultat ?? '')
}
/** Vide puis remplit la région : un même résultat redemandé est annoncé à nouveau par les lecteurs d’écran. */
async function annoncer(texte: string) {
  annonce.value = ''
  await nextTick()
  annonce.value = texte
}
function decider(v: Verdict) {
  if (choisi.value === null) choisi.value = v
}
</script>

<template>
  <div class="verification">
    <p class="consigne">{{ config.consigne }}</p>
    <article class="carte publication">
      <p><strong>{{ config.publication.auteur }}</strong><span v-if="config.publication.date"> · {{ config.publication.date }}</span></p>
      <p>{{ config.publication.texte }}</p>
      <figure v-if="config.publication.image" class="image-decrite">
        <figcaption>Image (décrite) : {{ config.publication.image.description }}</figcaption>
      </figure>
    </article>
    <h3>Enquête</h3>
    <ul class="actions-enquete">
      <li v-for="a in config.actions" :key="a.id">
        <button
          type="button"
          class="btn choix-btn"
          :aria-describedby="revelees.includes(a.id) ? `res-${a.id}` : undefined"
          @click="enqueter(a.id)"
        >
          {{ a.libelle }}
        </button>
        <p v-if="revelees.includes(a.id)" :id="`res-${a.id}`" class="resultat-enquete encadre encadre-doux">{{ a.resultat }}</p>
      </li>
    </ul>
    <p class="visually-hidden annonce-enquete" role="status">{{ annonce }}</p>
    <h3>Ton verdict</h3>
    <div class="actions" role="group" aria-label="Ton verdict">
      <button
        v-for="v in VERDICTS"
        :key="v"
        type="button"
        class="btn"
        :data-verdict="v"
        :disabled="choisi !== null"
        @click="decider(v)"
      >
        {{ LIBELLES[v] }}
      </button>
    </div>
    <!-- Reçoit le focus : pas de role="status", sinon le résultat serait annoncé deux fois. -->
    <div v-if="choisi !== null" ref="resultat" class="resultat-verdict encadre" :class="juste ? 'encadre-bon' : 'encadre-risque'" tabindex="-1">
      <p v-if="juste"><span aria-hidden="true">✅</span> Bien vu : {{ LIBELLES[config.verdict].toLowerCase() }}.</p>
      <p v-else><span aria-hidden="true">❌</span> La bonne réponse : {{ LIBELLES[config.verdict] }}.</p>
      <p>{{ config.explication }}</p>
      <p v-if="revelees.length === 0">Astuce : enquête avant de décider, c’est comme ça qu’on repère les fausses infos.</p>
    </div>
    <button
      v-if="choisi !== null"
      type="button"
      class="btn btn-primaire"
      @click="emit('termine', { reussites: juste ? 1 : 0, erreurs: juste ? 0 : 1 })"
    >
      Terminer le mini-jeu
    </button>
  </div>
</template>

<style scoped>
.consigne { color: var(--texte-doux); }
.image-decrite { margin: 0.5rem 0 0; padding: 1rem; border: 2px dashed var(--bord-fort); border-radius: 18px; min-height: 4rem; }
.actions-enquete { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }
.resultat-enquete { margin: 0.6rem 0 0 0.5rem; }
.resultat-verdict { margin: 1rem 0; }
</style>
