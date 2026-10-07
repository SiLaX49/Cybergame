<script setup lang="ts">
defineProps<{ appNom: string; contact: string }>()
</script>

<template>
  <figure class="telephone" :aria-label="`Écran de téléphone : ${appNom}`">
    <div class="encoche" aria-hidden="true"></div>
    <div class="ecran-telephone">
      <div class="barre-etat" aria-hidden="true"><span>14:32</span><span>4G ▮▮▮</span></div>
      <div class="entete-app">
        <span class="nom-app">{{ appNom }}</span>
        <strong class="contact">{{ contact }}</strong>
      </div>
      <!-- Zone défilante (grands textes, mode classe) : focusable pour défiler au clavier. -->
      <div class="ecran" tabindex="0" role="region" :aria-label="`Contenu de l’écran : ${appNom}`"><slot /></div>
    </div>
  </figure>
</template>

<style scoped>
/* Coque : la couleur de texte du thème (sombre en clair, claire en sombre) donne un contour net dans les deux modes. */
.telephone {
  margin: 0; width: 100%; max-width: 22rem;
  background: var(--fond); border: 10px solid var(--texte); border-radius: 36px;
  box-shadow: 0 6px 0 var(--bord-fort); overflow: hidden;
}
.encoche { width: 40%; height: 1.1rem; margin: 0.4rem auto; border-radius: 999px; background: var(--texte); }
.ecran-telephone { background: var(--fond); color: var(--texte); }
.barre-etat { display: flex; justify-content: space-between; padding: 0.3rem 1rem; font-size: 0.8em; color: var(--texte-doux); }
.entete-app { display: flex; flex-direction: column; padding: 0.5rem 1rem; background: var(--surface-2); border-bottom: 2px solid var(--bord); }
.nom-app { font-size: 0.8em; color: var(--texte-doux); }
.contact { overflow-wrap: anywhere; }
.ecran { padding: 0.75rem; max-height: 28em; overflow-y: auto; background: var(--fond); }
</style>
