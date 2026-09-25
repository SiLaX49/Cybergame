<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ fait: [] }>()
const MESSAGES = [
  {
    id: 'bon',
    texte: 'On a piraté mon compte. Si tu reçois un message bizarre de moi, ne clique sur rien et ne donne aucun code.',
    retour: '',
  },
  {
    id: 'codes',
    texte: 'Salut, envoie-moi le code que tu vas recevoir, c’est pour vérifier mon compte.',
    retour: 'C’est exactement ce que ferait un pirate ! Ne demande jamais de code à tes amis.',
  },
  {
    id: 'rien',
    texte: 'Coucou 😊',
    retour: 'Tes amis ne sauront pas qu’il faut se méfier des messages envoyés depuis ton compte.',
  },
]
const choix = ref<string | null>(null)
const retour = ref('')
const envoye = ref(false)

function envoyer() {
  const message = MESSAGES.find((m) => m.id === choix.value)
  if (!message) return
  if (message.id === 'bon') envoye.value = true
  else retour.value = message.retour
}
</script>

<template>
  <section class="recuperation carte">
    <h3>Préviens tes contacts</h3>
    <template v-if="!envoye">
      <fieldset>
        <legend>Quel message envoies-tu à tes amis ?</legend>
        <label v-for="m in MESSAGES" :key="m.id" class="option">
          <input v-model="choix" type="radio" name="message-contacts" :value="m.id" @change="retour = ''" /> {{ m.texte }}
        </label>
      </fieldset>
      <p v-if="retour" role="status">{{ retour }}</p>
      <button type="button" class="btn btn-primaire" :disabled="!choix" @click="envoyer">Envoyer</button>
    </template>
    <template v-else>
      <p role="status"><span aria-hidden="true">✅</span> Message envoyé. Tes amis savent qu’il faut se méfier.</p>
      <button type="button" class="btn btn-primaire" @click="emit('fait')">Continuer</button>
    </template>
  </section>
</template>
