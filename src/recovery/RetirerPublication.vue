<script setup lang="ts">
import { ref } from 'vue'
import { focusAuChangement } from '@/ui/focus'

const emit = defineEmits<{ fait: [] }>()
const EXCUSES = [
  {
    id: 'sinceres',
    texte: 'Je suis désolé·e, ce que j’ai publié était blessant. Je l’ai supprimé.',
    retour: '',
  },
  {
    id: 'pas-vraiment',
    texte: 'Désolé·e si tu t’es senti·e vexé·e, c’était pour rire.',
    retour:
      'Cette excuse rejette la faute sur l’autre (« si tu t’es senti·e vexé·e »). Une vraie excuse dit ce qu’on a fait.',
  },
  {
    id: 'rien',
    texte: '(Tu ne dis rien.)',
    retour: 'Supprimer ne suffit pas toujours : la personne a vu le message. Des excuses comptent.',
  },
]
const etape = ref<1 | 2 | 3 | 4>(1)
const choix = ref<string | null>(null)
const retour = ref('')
const titre = ref<HTMLElement | null>(null)
focusAuChangement(etape, titre)

function envoyer() {
  const excuse = EXCUSES.find((e) => e.id === choix.value)
  if (!excuse) return
  if (excuse.id === 'sinceres') etape.value = 3
  else retour.value = excuse.retour
}
</script>

<template>
  <section class="recuperation carte">
    <h3 ref="titre" tabindex="-1">Répare ce que tu as publié</h3>
    <template v-if="etape === 1">
      <button type="button" class="btn btn-primaire" @click="etape = 2">Supprimer ma publication</button>
    </template>
    <template v-else-if="etape === 2">
      <p><span aria-hidden="true">✅</span> Publication supprimée.</p>
      <fieldset>
        <legend>Quelles excuses envoies-tu ?</legend>
        <label v-for="e in EXCUSES" :key="e.id" class="option">
          <input v-model="choix" type="radio" name="excuses" :value="e.id" @change="retour = ''" /> {{ e.texte }}
        </label>
      </fieldset>
      <p v-if="retour" role="status">{{ retour }}</p>
      <button type="button" class="btn btn-primaire" :disabled="!choix" @click="envoyer">Envoyer</button>
    </template>
    <template v-else-if="etape === 3">
      <p role="status">Excuses envoyées.</p>
      <button type="button" class="btn btn-primaire" @click="etape = 4">Demander aux autres de ne pas repartager</button>
    </template>
    <template v-else>
      <p role="status"><span aria-hidden="true">✅</span> C’est possible de réparer. En parler à un adulte t’aide aussi.</p>
      <button type="button" class="btn btn-primaire" @click="emit('fait')">Continuer</button>
    </template>
  </section>
</template>
