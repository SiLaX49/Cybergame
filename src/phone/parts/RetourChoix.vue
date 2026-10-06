<script setup lang="ts">
import { provide, ref } from 'vue'
import type { Choix } from '@/content/schema'
import { gesteDuChoix } from '../gestes'
import { atteinte, type EtapeSequence } from '../sequence'
import { CLE_PASSAGES } from '../surlignage'
import BanniereSysteme from './BanniereSysteme.vue'
import Bulle from './Bulle.vue'
import EnTrainDEcrire from './EnTrainDEcrire.vue'
import Verdict from './Verdict.vue'

/** Retour du choix joué, étape par étape : ta réponse, « en train d’écrire… », la réaction, le verdict. */
defineProps<{ choix: Choix; etape: EtapeSequence; contact: string; verdict: 'piege' | 'bon' | null }>()
// Les indices se surlignent dans le message d'origine, jamais dans ces bulles.
provide(CLE_PASSAGES, ref([]))
</script>

<template>
  <template v-if="atteinte(etape, 'envoi')">
    <Bulle
      v-if="gesteDuChoix(choix) === 'repondre' && choix.reponse"
      :message="{ de: 'moi', texte: choix.reponse, texteSimple: choix.reponseSimple }"
      nom=""
    />
    <BanniereSysteme v-else :geste="gesteDuChoix(choix)" />
    <EnTrainDEcrire v-if="etape === 'ecrit'" :contact="contact" />
    <Bulle
      v-if="choix.reaction && atteinte(etape, 'reaction')"
      :message="{ de: 'contact', texte: choix.reaction, texteSimple: choix.reactionSimple }"
      :nom="contact"
    />
    <Verdict v-if="verdict" :verdict="verdict" />
  </template>
</template>
