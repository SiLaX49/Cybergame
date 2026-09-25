<script setup lang="ts">
import { computed, ref } from 'vue'

const emit = defineEmits<{ fait: [] }>()
const PERSONNES = [
  { id: 'parent', nom: 'Un parent ou un adulte de ta famille', role: 'Il ou elle peut t’aider à sécuriser tes comptes et à contacter la banque ou la plateforme.' },
  { id: 'prof', nom: 'Un·e prof', role: 'Il ou elle peut t’écouter et prévenir les bonnes personnes dans l’établissement.' },
  { id: 'cpe', nom: 'Le ou la CPE', role: 'Il ou elle gère les situations difficiles entre élèves et peut agir vite.' },
  { id: 'infirmier', nom: 'L’infirmier·e scolaire', role: 'Il ou elle peut t’écouter en toute confidentialité si ça te pèse.' },
  { id: '3018', nom: 'Le 3018 (gratuit, confidentiel, 7 j/7 de 9 h à 23 h)', role: 'Des spécialistes t’écoutent et peuvent faire supprimer des contenus sur les réseaux.' },
]
const choisi = ref<string | null>(null)
const personne = computed(() => PERSONNES.find((p) => p.id === choisi.value))
</script>

<template>
  <section class="recuperation carte">
    <h3>À qui en parler ?</h3>
    <p>Tu n’as pas à gérer ça seul·e. Choisis la personne à qui tu en parlerais :</p>
    <ul class="personnes">
      <li v-for="p in PERSONNES" :key="p.id">
        <button type="button" class="btn" :aria-pressed="choisi === p.id" @click="choisi = p.id">{{ p.nom }}</button>
      </li>
    </ul>
    <template v-if="personne">
      <p role="status">Bon choix. {{ personne.role }} Toutes ces personnes sont de bonnes options.</p>
      <button type="button" class="btn btn-primaire" @click="emit('fait')">Continuer</button>
    </template>
  </section>
</template>

<style scoped>
.personnes { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
</style>
