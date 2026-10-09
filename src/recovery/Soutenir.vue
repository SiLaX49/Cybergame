<script setup lang="ts">
import { computed, ref } from 'vue'
import { focusAuChangement } from '@/ui/focus'
import { SOUTENIR, type ContexteSensible } from './textes'

defineOptions({ name: 'SoutenirPersonneVisee' })
const props = withDefaults(defineProps<{ contexte?: ContexteSensible }>(), { contexte: 'harcelement' })
const emit = defineEmits<{ fait: [] }>()
const textes = computed(() => SOUTENIR[props.contexte])
const choix = ref<string | null>(null)
const retour = ref('')
const envoye = ref(false)
const titre = ref<HTMLElement | null>(null)
focusAuChangement(envoye, titre)

function envoyer() {
  const message = textes.value.messages.find((m) => m.id === choix.value)
  if (!message) return
  if (!message.retour) envoye.value = true
  else retour.value = message.retour
}
</script>

<template>
  <section class="recuperation carte">
    <h3 ref="titre" tabindex="-1">{{ textes.titre }}</h3>
    <template v-if="!envoye">
      <fieldset>
        <legend>{{ textes.question }}</legend>
        <label v-for="m in textes.messages" :key="m.id" class="option">
          <input v-model="choix" type="radio" name="message-soutien" :value="m.id" @change="retour = ''" /> {{ m.texte }}
        </label>
      </fieldset>
      <p v-if="retour" role="status" class="encadre encadre-doux">{{ retour }}</p>
      <button type="button" class="btn btn-primaire" :disabled="!choix" @click="envoyer">Envoyer</button>
    </template>
    <template v-else>
      <p role="status" class="encadre encadre-doux"><span aria-hidden="true">✅</span> {{ textes.envoye }}</p>
      <p>{{ textes.rappel }}</p>
      <button type="button" class="btn btn-primaire" @click="emit('fait')">Continuer</button>
    </template>
  </section>
</template>

<style scoped>
.encadre { margin: 0.75rem 0; }
</style>
