<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { RepereConfig } from '@/content/schema'

type Ligne = RepereConfig['lignes'][number]

const props = defineProps<{ config: RepereConfig }>()
const emit = defineEmits<{ termine: [resultat: { reussites: number; erreurs: number }] }>()

const trouves = ref<string[]>([])
const erreurs = ref(0)
const message = ref('')
const revele = ref(false)

const indices = computed(() => props.config.lignes.filter((l) => l.indice))
const fini = computed(() => revele.value || trouves.value.length === indices.value.length)
const marquee = (l: Ligne) => trouves.value.includes(l.id) || (revele.value && l.indice)

function cliquer(l: Ligne) {
  if (fini.value || trouves.value.includes(l.id)) return
  if (l.indice) {
    trouves.value.push(l.id)
    void annoncer(l.explication ?? '')
  } else {
    erreurs.value += 1
    void annoncer('Rien de suspect ici.')
  }
}
/** Vide puis remplit la région : un même message répété est annoncé à nouveau par les lecteurs d'écran. */
async function annoncer(texte: string) {
  message.value = ''
  await nextTick()
  message.value = texte
}
function reveler() {
  erreurs.value += indices.value.length - trouves.value.length
  revele.value = true
  message.value = ''
}
</script>

<template>
  <div class="repere">
    <p class="consigne">{{ config.consigne }}</p>
    <p class="compteur badge">Indices trouvés : {{ trouves.length }} sur {{ indices.length }}</p>
    <div class="carte ecran-repere">
      <p><strong>{{ config.titre }}</strong></p>
      <ul class="lignes">
        <li v-for="l in config.lignes" :key="l.id">
          <button type="button" class="ligne btn choix-btn" :class="{ marquee: marquee(l) }" :aria-pressed="marquee(l)" @click="cliquer(l)">
            {{ l.texte }}<span v-if="marquee(l)" class="marque"> (indice)</span>
          </button>
          <p v-if="revele && l.indice" class="explication encadre encadre-aide">{{ l.explication }}</p>
        </li>
      </ul>
    </div>
    <p role="status" :class="{ 'encadre encadre-info': message }">{{ message }}</p>
    <div class="actions">
      <button v-if="!fini" type="button" class="btn" @click="reveler">Voir la solution</button>
      <button v-else type="button" class="btn btn-primaire" @click="emit('termine', { reussites: trouves.length, erreurs })">
        Terminer le mini-jeu
      </button>
    </div>
  </div>
</template>

<style scoped>
.lignes { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; }
.consigne { color: var(--texte-doux); }
.ligne { font-weight: 600; border-style: dashed; }
.ligne.marquee { background: var(--aide-fond); border-style: solid; border-width: 3px; border-color: var(--aide); }
.marque { font-weight: 700; color: var(--texte); margin-left: 0.4em; }
.explication { margin: 0.5rem 0 0.5rem 0.6rem; }
</style>
