<script setup lang="ts">
import { ref } from 'vue'
import { focusAuChangement } from '@/ui/focus'

defineOptions({ name: 'SoutenirPersonneVisee' })
const emit =defineEmits<{ fait: [] }>()
const MESSAGES = [
  { id: 'ecoute', texte: 'Je suis là si tu veux en parler.', retour: '', bon: true },
  { id: 'adulte', texte: 'Tu veux que j’en parle à un adulte avec toi ?', retour: '', bon: true },
  {
    id: 'minimise',
    texte: 'Laisse tomber, ils sont bêtes.',
    retour:
      'Ton message part d’une bonne intention, mais il peut donner l’impression que ce n’est pas grave. Dis plutôt que tu es là.',
    bon: false,
  },
  {
    id: 'public',
    texte: '(Tu réponds aux harceleurs dans le groupe.)',
    retour: 'Répondre en public peut relancer les attaques. Écris d’abord en privé à la personne visée.',
    bon: false,
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
  if (message.bon) envoye.value = true
  else retour.value = message.retour
}
</script>

<template>
  <section class="recuperation carte">
    <h3 ref="titre" tabindex="-1">Écris à la personne visée, en privé</h3>
    <template v-if="!envoye">
      <fieldset>
        <legend>Quel message lui envoies-tu ?</legend>
        <label v-for="m in MESSAGES" :key="m.id" class="option">
          <input v-model="choix" type="radio" name="message-soutien" :value="m.id" @change="retour = ''" /> {{ m.texte }}
        </label>
      </fieldset>
      <p v-if="retour" role="status">{{ retour }}</p>
      <button type="button" class="btn btn-primaire" :disabled="!choix" @click="envoyer">Envoyer</button>
    </template>
    <template v-else>
      <p role="status"><span aria-hidden="true">✅</span> Message envoyé.</p>
      <p>Garde une capture des messages, et préviens un adulte : ensemble, vous pouvez faire cesser le harcèlement.</p>
      <button type="button" class="btn btn-primaire" @click="emit('fait')">Continuer</button>
    </template>
  </section>
</template>
