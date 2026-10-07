<script setup lang="ts">
import { ref } from 'vue'
import { focusAuChangement } from '@/ui/focus'
import { RETIRER_PUBLICATION as T } from './textes'

const emit = defineEmits<{ fait: [] }>()
const etape = ref<1 | 2 | 3 | 4>(1)
const choix = ref<string | null>(null)
const retour = ref('')
const titre = ref<HTMLElement | null>(null)
focusAuChangement(etape, titre)

function envoyer() {
  const excuse = T.excuses.find((e) => e.id === choix.value)
  if (!excuse) return
  if (!excuse.retour) etape.value = 3
  else retour.value = excuse.retour
}
</script>

<template>
  <section class="recuperation carte">
    <h3 ref="titre" tabindex="-1">{{ T.titre }}</h3>
    <template v-if="etape === 1">
      <button type="button" class="btn btn-primaire" @click="etape = 2">{{ T.supprimer }}</button>
    </template>
    <template v-else-if="etape === 2">
      <p><span aria-hidden="true">✅</span> {{ T.supprimee }}</p>
      <fieldset>
        <legend>{{ T.question }}</legend>
        <label v-for="e in T.excuses" :key="e.id" class="option">
          <input v-model="choix" type="radio" name="excuses" :value="e.id" @change="retour = ''" /> {{ e.texte }}
        </label>
      </fieldset>
      <p v-if="retour" role="status">{{ retour }}</p>
      <button type="button" class="btn btn-primaire" :disabled="!choix" @click="envoyer">Envoyer</button>
    </template>
    <template v-else-if="etape === 3">
      <p role="status">{{ T.envoyees }}</p>
      <button type="button" class="btn btn-primaire" @click="etape = 4">{{ T.repartager }}</button>
    </template>
    <template v-else>
      <p role="status"><span aria-hidden="true">✅</span> {{ T.rappel }}</p>
      <button type="button" class="btn btn-primaire" @click="emit('fait')">Continuer</button>
    </template>
  </section>
</template>
