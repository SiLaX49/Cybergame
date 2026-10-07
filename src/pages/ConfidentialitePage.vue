<script setup lang="ts">
import EffacerProgression from '@/ui/EffacerProgression.vue'
</script>

<template>
  <main class="conteneur confidentialite">
    <h1>Confidentialité</h1>
    <section class="carte">
      <h2>Ce que le jeu enregistre</h2>
      <p>Ton niveau, ta façon de jouer (solo, binôme, classe), tes réglages, les missions terminées et tes badges. C’est tout.</p>
    </section>
    <section class="carte">
      <h2>Où ?</h2>
      <p>Uniquement dans ce navigateur, sur cet appareil. Rien n’est envoyé sur Internet.</p>
    </section>
    <section class="carte">
      <h2>Ce que le jeu ne fait pas</h2>
      <p>Pas de compte, pas de nom, pas d’adresse mail, pas de publicité, pas de cookie de suivi, pas de statistiques.</p>
    </section>
    <section class="carte">
      <h2>Sur un ordinateur partagé ?</h2>
      <p>Efface ta progression avant de partir :</p>
      <EffacerProgression />
    </section>
    <section class="carte">
      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par GitHub Pages (GitHub, Inc.). Comme tout hébergeur, GitHub peut enregistrer des informations
        techniques, comme l’adresse IP, pour assurer la sécurité du service.
      </p>
    </section>
  </main>
</template>

<style scoped>
.confidentialite { display: grid; gap: 1rem; }
.confidentialite h1 { margin-bottom: 0; }
.confidentialite .carte h2 { margin-top: 0; }
.confidentialite .carte > :last-child { margin-bottom: 0; }
</style>
