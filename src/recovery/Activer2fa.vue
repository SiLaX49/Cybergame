<script setup lang="ts">
import { computed, ref } from 'vue'
import { focusAuChangement } from '@/ui/focus'

defineOptions({ name: 'ActiverDoubleAuthentification' })
const emit = defineEmits<{ fait: [] }>()
const CODE = '482913'
const etape = ref<'parametres' | 'securite' | 'methode' | 'code' | 'fini'>('parametres')
const methode = ref<'appli' | 'sms' | null>(null)
const code = ref('')
const codeOk = computed(() => code.value.replace(/\s/g, '') === CODE)
const titre = ref<HTMLElement | null>(null)
focusAuChangement(etape, titre)
</script>

<template>
  <section class="recuperation carte">
    <h3 ref="titre" tabindex="-1">Active la double authentification</h3>
    <template v-if="etape === 'parametres'">
      <p>Ouvre les paramètres de ton compte.</p>
      <button type="button" class="btn" @click="etape = 'securite'"><span aria-hidden="true">⚙️</span> Paramètres</button>
    </template>
    <template v-else-if="etape === 'securite'">
      <p class="encadre encadre-info">Avec la double authentification, même quelqu’un qui connaît ton mot de passe ne pourra pas se connecter sans un code.</p>
      <button type="button" class="btn" @click="etape = 'methode'">Activer la double authentification</button>
    </template>
    <template v-else-if="etape === 'methode'">
      <fieldset>
        <legend>Comment veux-tu recevoir tes codes ?</legend>
        <label class="option"><input v-model="methode" type="radio" name="methode" value="appli" /> Une appli d’authentification (le plus sûr)</label>
        <label class="option"><input v-model="methode" type="radio" name="methode" value="sms" /> Par SMS</label>
      </fieldset>
      <button type="button" class="btn btn-primaire" :disabled="!methode" @click="etape = 'code'">Suivant</button>
    </template>
    <template v-else-if="etape === 'code'">
      <p>Code reçu : <strong>482 913</strong></p>
      <label for="code-2fa">Recopie le code</label>
      <input id="code-2fa" v-model="code" inputmode="numeric" autocomplete="off" />
      <p class="avertissement encadre encadre-aide">Ne donne JAMAIS ce code à quelqu’un, même à un ami ou à un « support ».</p>
      <button type="button" class="btn btn-primaire" :disabled="!codeOk" @click="etape = 'fini'">Valider</button>
    </template>
    <template v-else>
      <p role="status" class="encadre encadre-bon"><span aria-hidden="true">✅</span> Double authentification activée. Ton compte est bien mieux protégé.</p>
      <button type="button" class="btn btn-primaire" @click="emit('fait')">Continuer</button>
    </template>
  </section>
</template>

<style scoped>
.encadre { margin: 0.75rem 0; }
input[type='text'], #code-2fa {
  display: block; min-height: 48px; width: 100%; max-width: 20rem; margin: 0.3rem 0 0.6rem; padding: 0.4rem 0.8rem;
  font-size: 1.15em; letter-spacing: 0.1em; color: var(--texte); background: var(--surface);
  border: 2px solid var(--bord-fort); border-radius: var(--rayon-btn);
}
</style>
