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
    <p>{{ config.consigne }}</p>
    <p class="compteur">Indices trouvés : {{ trouves.length }} sur {{ indices.length }}</p>
    <div class="carte ecran-repere">
      <p><strong>{{ config.titre }}</strong></p>
      <ul class="lignes">
        <li v-for="l in config.lignes" :key="l.id">
          <button type="button" class="ligne" :class="{ marquee: marquee(l) }" :aria-pressed="marquee(l)" @click="cliquer(l)">
            {{ l.texte }}<span v-if="marquee(l)" class="marque"> (indice)</span>
          </button>
          <p v-if="revele && l.indice" class="explication">{{ l.explication }}</p>
        </li>
      </ul>
    </div>
    <p role="status">{{ message }}</p>
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
.ligne {
  width: 100%; min-height: 44px; text-align: left; padding: 0.4rem 0.6rem; font: inherit;
  background: transparent; border: 2px dashed var(--bord); border-radius: 8px; cursor: pointer;
}
.ligne.marquee { border: 3px solid var(--risque); background: #fdecea; }
.marque { font-weight: 700; color: var(--risque); }
.explication { margin: 0.2rem 0 0.5rem 0.6rem; color: var(--texte-doux); }
</style>
