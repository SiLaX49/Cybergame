<script setup lang="ts">
import { computed, ref } from 'vue'
import { focusAuChangement } from '@/ui/focus'
import { evaluerMotDePasse } from './motDePasse'

const emit = defineEmits<{ fait: [] }>()
const etape = ref<'parametres' | 'securite' | 'formulaire' | 'fini'>('parametres')
const mdp = ref('')
const deconnecter = ref(false)
const problemes = computed(() => evaluerMotDePasse(mdp.value))
const titre = ref<HTMLElement | null>(null)
focusAuChangement(etape, titre)
const valide = computed(() => mdp.value.length > 0 && problemes.value.length === 0 && deconnecter.value)

function enregistrer() {
  if (valide.value) etape.value = 'fini'
}
</script>

<template>
  <section class="recuperation carte">
    <h3 ref="titre" tabindex="-1">Change ton mot de passe</h3>
    <template v-if="etape === 'parametres'">
      <p>Ouvre les paramètres de ton compte.</p>
      <button type="button" class="btn" @click="etape = 'securite'"><span aria-hidden="true">⚙️</span> Paramètres</button>
    </template>
    <template v-else-if="etape === 'securite'">
      <p>Va dans la rubrique qui protège ton compte.</p>
      <button type="button" class="btn" @click="etape = 'formulaire'"><span aria-hidden="true">🔒</span> Sécurité et connexion</button>
    </template>
    <form v-else-if="etape === 'formulaire'" @submit.prevent="enregistrer">
      <p class="avertissement encadre encadre-aide">C’est un jeu : n’écris pas ton vrai mot de passe !</p>
      <label for="nouveau-mdp">Nouveau mot de passe</label>
      <input id="nouveau-mdp" v-model="mdp" type="text" autocomplete="off" aria-describedby="conseils-mdp" />
      <ul id="conseils-mdp" aria-live="polite">
        <li v-for="p in problemes" :key="p">{{ p }}</li>
        <li v-if="mdp && !problemes.length"><span aria-hidden="true">✅</span> Mot de passe solide.</li>
      </ul>
      <label class="option">
        <input v-model="deconnecter" type="checkbox" />
        Déconnecter tous les autres appareils (au cas où quelqu’un d’autre serait connecté)
      </label>
      <button type="submit" class="btn btn-primaire" :disabled="!valide">Enregistrer</button>
    </form>
    <template v-else>
      <p role="status" class="encadre encadre-bon">
        <span aria-hidden="true">✅</span> Mot de passe changé et autres appareils déconnectés. Si quelqu’un avait
        ton ancien mot de passe, il est dehors.
      </p>
      <button type="button" class="btn btn-primaire" @click="emit('fait')">Continuer</button>
    </template>
  </section>
</template>

<style scoped>
.encadre { margin: 0.75rem 0; }
#nouveau-mdp {
  display: block; min-height: 48px; width: 100%; max-width: 32rem; margin: 0.3rem 0 0.6rem; padding: 0.4rem 0.8rem;
  color: var(--texte); background: var(--surface); border: 2px solid var(--bord-fort); border-radius: var(--rayon-btn);
}
#conseils-mdp { list-style: none; padding: 0; }
#conseils-mdp li { padding: 0.15rem 0; }
</style>
