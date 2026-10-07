<script setup lang="ts">
import type { Reglages } from '@/store/progress'
import { useProgress } from '@/store/useProgress'
import ChoixPersonnage from '@/parcours/ChoixPersonnage.vue'
import EffacerProgression from './EffacerProgression.vue'

const emit = defineEmits<{ fermer: [] }>()
const store = useProgress()

const THEMES: { valeur: Reglages['theme']; libelle: string }[] = [
  { valeur: 'auto', libelle: 'Automatique (comme l’appareil)' },
  { valeur: 'clair', libelle: 'Clair' },
  { valeur: 'sombre', libelle: 'Sombre' },
]
const TAILLES: { valeur: Reglages['taille']; libelle: string }[] = [
  { valeur: 'normal', libelle: 'Normale' },
  { valeur: 'grand', libelle: 'Grande' },
  { valeur: 'tres-grand', libelle: 'Très grande' },
]
const INTERLIGNES: { valeur: Reglages['interligne']; libelle: string }[] = [
  { valeur: 'normal', libelle: 'Normal' },
  { valeur: 'large', libelle: 'Large' },
]
const coche = (e: Event) => (e.target as HTMLInputElement).checked
</script>

<template>
  <section
    id="panneau-reglages"
    class="reglages carte conteneur"
    aria-labelledby="titre-reglages"
    @keydown.esc="emit('fermer')"
  >
    <h2 id="titre-reglages">Réglages</h2>
    <fieldset>
      <legend>Thème</legend>
      <label v-for="t in THEMES" :key="t.valeur" class="option">
        <input
          type="radio"
          name="theme"
          :value="t.valeur"
          :checked="store.etat.reglages.theme === t.valeur"
          @change="store.modifierReglages({ theme: t.valeur })"
        />
        {{ t.libelle }}
      </label>
    </fieldset>
    <fieldset>
      <legend>Taille du texte</legend>
      <label v-for="t in TAILLES" :key="t.valeur" class="option">
        <input
          type="radio"
          name="taille"
          :value="t.valeur"
          :checked="store.etat.reglages.taille === t.valeur"
          @change="store.modifierReglages({ taille: t.valeur })"
        />
        {{ t.libelle }}
      </label>
    </fieldset>
    <fieldset>
      <legend>Espacement des lignes</legend>
      <label v-for="i in INTERLIGNES" :key="i.valeur" class="option">
        <input
          type="radio"
          name="interligne"
          :value="i.valeur"
          :checked="store.etat.reglages.interligne === i.valeur"
          @change="store.modifierReglages({ interligne: i.valeur })"
        />
        {{ i.libelle }}
      </label>
    </fieldset>
    <ChoixPersonnage
      legende="Personnage des parcours"
      name="personnage-reglages"
      :model-value="store.etat.personnage"
      @update:model-value="store.choisirPersonnage"
    />
    <label class="option">
      <input
        type="checkbox"
        name="lecture-simple"
        :checked="store.etat.reglages.lectureSimple"
        @change="store.modifierReglages({ lectureSimple: coche($event) })"
      />
      Lecture simplifiée (phrases plus courtes)
    </label>
    <label class="option">
      <input
        type="checkbox"
        name="animations"
        :checked="store.etat.reglages.animations"
        @change="store.modifierReglages({ animations: coche($event) })"
      />
      Animations
    </label>
    <label class="option">
      <input
        type="checkbox"
        name="chrono"
        :checked="store.etat.reglages.chrono"
        @change="store.modifierReglages({ chrono: coche($event) })"
      />
      Chronomètre dans les mini-jeux
    </label>
    <EffacerProgression />
    <div class="actions">
      <button type="button" class="btn btn-primaire" @click="emit('fermer')">Fermer</button>
    </div>
  </section>
</template>
