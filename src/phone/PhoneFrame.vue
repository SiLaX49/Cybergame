<script setup lang="ts">
defineProps<{ appNom: string; contact: string }>()
</script>

<template>
  <figure class="telephone" :aria-label="`Écran de téléphone : ${appNom}`">
    <div class="barre-etat" aria-hidden="true"><span>14:32</span><span>4G ▮▮▮</span></div>
    <div class="entete-app">
      <span class="nom-app">{{ appNom }}</span>
      <strong class="contact">{{ contact }}</strong>
    </div>
    <!-- Zone défilante (grands textes, mode classe) : focusable pour défiler au clavier. -->
    <div class="ecran" tabindex="0" role="region" :aria-label="`Contenu de l’écran : ${appNom}`"><slot /></div>
  </figure>
</template>

<style scoped>
.telephone {
  margin: 0; width: 100%; max-width: 22rem;
  border: 10px solid #1b1b2f; border-radius: 32px; background: #fff; overflow: hidden;
}
.barre-etat { display: flex; justify-content: space-between; padding: 0.2rem 1rem; font-size: 0.8em; background: #1b1b2f; color: #fff; }
.entete-app { display: flex; flex-direction: column; padding: 0.5rem 1rem; border-bottom: 1px solid var(--bord); }
.nom-app { font-size: 0.8em; color: var(--texte-doux); }
.contact { overflow-wrap: anywhere; }
.ecran { padding: 0.75rem; max-height: 28em; overflow-y: auto; }
</style>
