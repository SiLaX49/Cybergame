<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import PersonnageG from '@/parcours/PersonnageG.vue'
import { ILES_INFO } from '@/parcours/iles'
import type { PersonnageId } from '@/store/progress'
import { estIleCalme, nomIle } from './archipel'
import IleDessin from './IleDessin.vue'
import { compteurIle, nomAccessibleIle } from './libelles'
import type { EtatIle } from './progression'

const props = defineProps<{ theme: string; titreTheme: string; etat: EtatIle; ici: boolean; personnage: PersonnageId | null }>()
const calme = computed(() => estIleCalme(props.theme))
const nom = computed(() => nomIle(props.theme) ?? props.titreTheme)
const objet = computed(() => (calme.value ? null : (ILES_INFO as Record<string, { objet: { emoji: string; nom: string } }>)[props.theme]?.objet ?? null))
const label = computed(() =>
  nomAccessibleIle({ nom: nom.value, objet: objet.value?.nom ?? null, calme: calme.value, ici: props.ici, etat: props.etat }),
)
</script>

<template>
  <RouterLink :to="{ name: 'ile', params: { theme } }" class="ile-lien" :class="{ calme }" :data-theme="theme" :aria-label="label">
    <span class="ile-visuel">
      <IleDessin :theme="theme" />
      <span v-if="objet && etat.objetGagne" class="ile-objet" aria-hidden="true">{{ objet.emoji }}</span>
      <svg v-if="ici && personnage" class="ile-perso" viewBox="-20 -60 40 62" aria-hidden="true" focusable="false">
        <PersonnageG :id="personnage" />
      </svg>
    </span>
    <span class="ile-etiquette" aria-hidden="true">
      <strong>{{ nom }}</strong>
      <span>{{ compteurIle(etat) }}</span>
      <span v-if="etat.complete && !calme" class="ile-drapeau">🚩 terminée</span>
    </span>
  </RouterLink>
</template>

<style scoped>
.ile-lien {
  display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
  text-decoration: none; color: var(--texte);
  min-width: 44px; min-height: 44px; border-radius: var(--rayon-carte); padding: 0.25rem;
}
.ile-visuel { position: relative; display: block; width: 100%; animation: flotte 4s ease-in-out infinite; }
@keyframes flotte { 50% { transform: translateY(-4px); } }
.ile-objet {
  position: absolute; top: 0; right: 4%; width: 2rem; height: 2rem; display: grid; place-items: center;
  background: var(--surface); border: 2px solid var(--bord-fort); border-radius: 50%; font-size: 1.1rem;
}
.ile-perso { position: absolute; left: 50%; bottom: 30%; height: 45%; width: auto; transform: translateX(-50%); }
.ile-etiquette {
  display: flex; flex-direction: column; background: var(--surface); border: 2px solid var(--bord-fort);
  border-radius: 14px; padding: 0.2em 0.6em; font-size: 0.85em; text-align: center; box-shadow: 0 3px 0 var(--bord-fort);
}
.ile-etiquette strong { font-family: var(--police-titres); }
.ile-lien:hover .ile-etiquette { border-color: var(--primaire); }
</style>
