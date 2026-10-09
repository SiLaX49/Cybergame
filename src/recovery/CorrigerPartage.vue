<script setup lang="ts">
import { ref } from 'vue'
import { focusAuChangement } from '@/ui/focus'

const emit = defineEmits<{ fait: [] }>()
const MESSAGES = [
  {
    id: 'bon',
    texte: 'J’ai partagé un truc faux, désolé. Ne le faites pas tourner : je vous mets le lien qui le prouve.',
    retour: '',
  },
  {
    id: 'supprimer',
    texte: '(Tu supprimes ton message sans rien dire.)',
    retour: 'Supprimer, c’est bien, mais ceux qui l’ont déjà vu croient encore que c’est vrai. Préviens-les.',
  },
  {
    id: 'rien',
    texte: 'C’était pour rire 😂',
    retour: 'Tes amis ne sauront pas que c’était faux, et ils risquent de le partager à leur tour.',
  },
]
const choix = ref<string | null>(null)
const retour = ref('')
const envoye = ref(false)
const titre = ref<HTMLElement | null>(null)
focusAuChangement(envoye, titre)

function envoyer() {
  const message = MESSAGES.find((m) => m.id === choix.value)
  if (!message) return
  if (message.id === 'bon') envoye.value = true
  else retour.value = message.retour
}
</script>

<template>
  <section class="recuperation carte">
    <h3 ref="titre" tabindex="-1">Préviens que c’était faux</h3>
    <template v-if="!envoye">
      <fieldset>
        <legend>Quel message envoies-tu à ceux qui ont reçu ton partage ?</legend>
        <label v-for="m in MESSAGES" :key="m.id" class="option">
          <input v-model="choix" type="radio" name="message-correction" :value="m.id" @change="retour = ''" /> {{ m.texte }}
        </label>
      </fieldset>
      <p v-if="retour" role="status" class="encadre encadre-aide">{{ retour }}</p>
      <button type="button" class="btn btn-primaire" :disabled="!choix" @click="envoyer">Envoyer</button>
    </template>
    <template v-else>
      <p role="status" class="encadre encadre-bon"><span aria-hidden="true">✅</span> Message envoyé. Tu as arrêté la rumeur de ton côté.</p>
      <button type="button" class="btn btn-primaire" @click="emit('fait')">Continuer</button>
    </template>
  </section>
</template>

<style scoped>
.encadre { margin: 0.75rem 0; }
</style>
