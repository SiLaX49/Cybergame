<script setup lang="ts">
import { computed, ref } from 'vue'
import { focusAuChangement } from '@/ui/focus'
import { BLOQUER_SIGNALER as T, motifsSignalement, type ContexteSensible } from './textes'

const props = defineProps<{ contexte?: ContexteSensible }>()
const emit = defineEmits<{ fait: [] }>()
const etape = ref<'menu' | 'options' | 'signaler' | 'fini'>('menu')
const motif = ref<string | null>(null)
const motifs = computed(() => motifsSignalement(props.contexte))
const titre = ref<HTMLElement | null>(null)
focusAuChangement(etape, titre)
</script>

<template>
  <section class="recuperation carte">
    <h3 ref="titre" tabindex="-1">{{ T.titre }}</h3>
    <template v-if="etape === 'menu'">
      <p>{{ T.menu }}</p>
      <button type="button" class="btn" @click="etape = 'options'"><span aria-hidden="true">⋮</span> {{ T.boutonMenu }}</button>
    </template>
    <template v-else-if="etape === 'options'">
      <p>{{ T.bloquerConsigne }}</p>
      <button type="button" class="btn" @click="etape = 'signaler'"><span aria-hidden="true">🚫</span> {{ T.boutonBloquer }}</button>
    </template>
    <template v-else-if="etape === 'signaler'">
      <fieldset>
        <legend>{{ T.question }}</legend>
        <label v-for="m in motifs" :key="m" class="option">
          <input v-model="motif" type="radio" name="motif" :value="m" /> {{ m }}
        </label>
      </fieldset>
      <button type="button" class="btn btn-primaire" :disabled="!motif" @click="etape = 'fini'">{{ T.envoyer }}</button>
    </template>
    <template v-else>
      <p role="status"><span aria-hidden="true">✅</span> {{ T.rappel }}</p>
      <button type="button" class="btn btn-primaire" @click="emit('fait')">Continuer</button>
    </template>
  </section>
</template>
