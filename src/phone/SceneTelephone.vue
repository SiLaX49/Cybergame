<script setup lang="ts">
import { ref, useId } from 'vue'
import type { FilAction } from '@/content/schema'
import ChoixScene from './parts/ChoixScene.vue'
import type { Scene } from './scene'
import Telephone from './Telephone.vue'
import { etatDepart, type EtatTelephone } from './useEntree'

/**
 * Scène unique : le téléphone à gauche, un panneau à droite (en-tête, choix, puis la suite de la page).
 * En mode scène (MissionPage), la grille sert de conteneur au téléphone et le panneau défile seul.
 */
const props = defineProps<{ scene: Scene }>()
const emit = defineEmits<{
  choisir: [choixId: string]
  agir: [notificationId: string, action: FilAction]
  'sequence-finie': []
}>()
defineSlots<{ entete?: (props: { idQuestion: string }) => unknown; default?: () => unknown }>()
/** Id à poser sur le `h2` de l’en-tête : il nomme le groupe des choix. */
const idQuestion = useId()
/** Les choix n’apparaissent qu’une fois l’appli ouverte : l’élève lit d’abord le message. */
const etat = ref<EtatTelephone>(etatDepart(props.scene))
</script>

<template>
  <div class="scene-grille">
    <Telephone
      :ecran="scene.ecran"
      :choix="scene.choix"
      :choix-joue="scene.choixJoue"
      :actions-notif="scene.actionsNotif"
      :indices="scene.indices"
      :indice-visible="scene.indiceVisible"
      :entree="scene.entree"
      @agir="(id, a) => emit('agir', id, a)"
      @sequence-finie="emit('sequence-finie')"
      @etat="(e) => (etat = e)"
    />
    <!-- Défile seul en mode scène (MissionPage) : focusable pour défiler au clavier. -->
    <div class="scene-panneau" role="region" tabindex="0" aria-label="Question et explications">
      <slot name="entete" :id-question="idQuestion" />
      <ChoixScene
        v-if="scene.choix && !scene.choixJoue && etat === 'appli'"
        :key="scene.graine"
        :choix="scene.choix"
        :graine="scene.graine ?? ''"
        :mode="scene.mode ?? 'solo'"
        :labelledby="idQuestion"
        @choisir="(id) => emit('choisir', id)"
      />
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* En mode scène, la grille remplit la zone de jeu et sert de conteneur au téléphone ; sinon, hauteur du contenu. */
.scene-grille {
  display: grid; gap: 1.5rem; grid-template-columns: auto minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); align-items: start;
  height: 100%; container-type: var(--scene-conteneur, normal);
}
.scene-panneau { max-height: 100%; overflow-y: var(--scene-defilement, visible); padding: 0.375rem; }
@media (max-width: 48em) { .scene-grille { grid-template-columns: minmax(0, 1fr); } }
</style>
