<script setup lang="ts">
import { Ban, HardDrive, Monitor, Server, ShieldCheck, Smartphone } from '@lucide/vue'
import EffacerProgression from '@/ui/EffacerProgression.vue'
</script>

<template>
  <main class="conteneur confidentialite">
    <header class="carte entete">
      <span class="pastille-entete" aria-hidden="true"><ShieldCheck :size="32" /></span>
      <div>
        <p class="surtitre">Tes données</p>
        <h1>Confidentialité</h1>
        <p class="promesse">Aucune donnée ne quitte l’appareil.</p>
      </div>
    </header>

    <div class="grille">
      <section class="carte bloc" aria-labelledby="titre-enregistre">
        <span class="pastille-bloc" aria-hidden="true"><HardDrive :size="20" /></span>
        <h2 id="titre-enregistre">Ce que le jeu enregistre</h2>
        <p>Ton niveau, ta façon de jouer (solo, binôme, classe), tes réglages, les missions terminées et tes badges. C’est tout.</p>
      </section>
      <section class="carte bloc" aria-labelledby="titre-ou">
        <span class="pastille-bloc" aria-hidden="true"><Smartphone :size="20" /></span>
        <h2 id="titre-ou">Où ?</h2>
        <p>Uniquement dans ce navigateur, sur cet appareil. Rien n’est envoyé sur Internet.</p>
      </section>
      <section class="carte bloc" aria-labelledby="titre-pas">
        <span class="pastille-bloc" aria-hidden="true"><Ban :size="20" /></span>
        <h2 id="titre-pas">Ce que le jeu ne fait pas</h2>
        <p>Pas de compte, pas de nom, pas d’adresse mail, pas de publicité, pas de cookie de suivi, pas de statistiques.</p>
      </section>
    </div>

    <section class="carte bloc partage" aria-labelledby="titre-partage">
      <span class="pastille-bloc" aria-hidden="true"><Monitor :size="20" /></span>
      <div>
        <h2 id="titre-partage">Sur un ordinateur partagé ?</h2>
        <p>Efface ta progression avant de partir :</p>
        <EffacerProgression />
      </div>
    </section>

    <section class="carte bloc hebergement" aria-labelledby="titre-hebergement">
      <span class="pastille-bloc" aria-hidden="true"><Server :size="20" /></span>
      <div>
        <h2 id="titre-hebergement">Hébergement</h2>
        <p>
          Le site est hébergé par GitHub Pages (GitHub, Inc.). Comme tout hébergeur, GitHub peut enregistrer des informations
          techniques, comme l’adresse IP, pour assurer la sécurité du service.
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.confidentialite { display: grid; gap: 1.5rem; padding-block: 2.5rem; }
.entete { display: flex; align-items: center; gap: 1.5rem; background: linear-gradient(to bottom right, var(--surface), var(--surface-2)); }
.entete h1 { margin: 0; }
.entete .surtitre { margin: 0; }
.promesse { margin: 0.35rem 0 0; font-weight: 600; color: var(--bon); }
.pastille-entete {
  flex: none; display: grid; place-items: center; width: 4rem; height: 4rem; border-radius: 50%;
  background: var(--bon-fond); color: var(--bon); border: 2px solid var(--bon);
}

.grille { display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); }
.bloc h2 { margin: 0.75rem 0 0.4rem; font-size: 1.1em; }
.bloc p { margin: 0; color: var(--texte-doux); }
.pastille-bloc {
  flex: none; display: inline-grid; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: 12px;
  background: var(--surface-2); color: var(--primaire);
}
.partage, .hebergement { display: flex; gap: 1rem; align-items: flex-start; }
.partage h2, .hebergement h2 { margin-top: 0.4rem; }
.partage p { margin-bottom: 1rem; }
.hebergement { background: var(--surface-2); box-shadow: none; }
.hebergement .pastille-bloc { background: var(--surface); }

@media (max-width: 36rem) {
  .entete { flex-direction: column; align-items: flex-start; gap: 1rem; }
}
</style>
