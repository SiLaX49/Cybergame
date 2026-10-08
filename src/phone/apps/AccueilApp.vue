<script setup lang="ts">
import { ref } from 'vue'
import { NOMS_APPLIS } from '../applis'
import IconeAppli from '../parts/IconeAppli.vue'

/** Écran d’accueil : seule l’appli du scénario s’ouvre ; les autres, en blanc, sont annoncées indisponibles. */
const props = defineProps<{ appNom: string }>()
const emit = defineEmits<{ ouvrir: [] }>()

const DOCK = ['Messages', 'Navigateur', 'Mail', 'SnapTalk']
const RANGEES = [
  { classe: 'grille', noms: NOMS_APPLIS.filter((n) => !DOCK.includes(n)) },
  { classe: 'dock', noms: DOCK },
]
const annonce = ref('')

function toucher(nom: string) {
  if (nom === props.appNom) emit('ouvrir')
  // Le nom de l’appli change le texte : le lecteur d’écran répète l’annonce d’une appli à l’autre.
  else annonce.value = `${nom} : pas disponible dans ce scénario`
}
</script>

<template>
  <div class="accueil">
    <template v-for="(r, i) in RANGEES" :key="r.classe">
      <p v-if="i === 1" class="pages" aria-hidden="true"><span class="active" /><span /></p>
      <ul :class="r.classe">
        <li v-for="nom in r.noms" :key="nom">
          <button
            type="button"
            class="appli"
            :data-appli="nom"
            :aria-disabled="nom === appNom ? undefined : 'true'"
            @click="toucher(nom)"
          >
            <span class="icone">
              <IconeAppli :nom="nom" />
              <span v-if="nom === appNom" class="pastille" aria-hidden="true">1</span>
            </span>
            <span class="libelle">{{ nom }}</span>
            <span v-if="nom === appNom" class="visually-hidden">, 1 notification</span>
          </button>
        </li>
      </ul>
    </template>
    <p class="annonce" role="status">{{ annonce }}</p>
  </div>
</template>

<style scoped>
.accueil { display: flex; flex-direction: column; gap: 0.75rem; min-height: 100%; }
.grille, .dock { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.75rem 0.5rem; }
.grille { flex: 1; align-content: start; }
.dock { padding: 0.6rem 0.4rem; border-radius: 22px; background: var(--tel-recu); }
.appli { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; width: 100%; padding: 0.3rem 0.1rem; border: 0; border-radius: 12px; background: transparent; color: var(--tel-texte); font: inherit; cursor: pointer; }
.appli:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.appli[aria-disabled='true'] { cursor: not-allowed; }
/* « En blanc » : fond blanc, contour, icône désaturée ; le libellé reste lisible. */
.appli[aria-disabled='true'] :deep(.icone-appli) { background: #ffffff !important; color: var(--tel-doux) !important; box-shadow: inset 0 0 0 2px var(--tel-bord); }
.icone { position: relative; display: inline-flex; font-size: 1.15em; }
.pastille { position: absolute; top: -0.4em; right: -0.5em; min-width: 1.4em; padding: 0 0.3em; border-radius: 999px; background: #c8102e; color: #ffffff; font-size: 0.7em; font-weight: 700; line-height: 1.4em; text-align: center; box-shadow: 0 0 0 2px var(--tel-fond); }
.libelle { font-size: 0.85em; line-height: 1.2; text-align: center; overflow-wrap: anywhere; }
.pages { display: flex; justify-content: center; gap: 0.4rem; margin: 0; }
.pages span { width: 0.5rem; height: 0.5rem; border-radius: 50%; background: var(--tel-bord); }
.pages .active { background: var(--tel-texte); }
.annonce { margin: 0; min-height: 1.4em; text-align: center; font-weight: 700; }
</style>
