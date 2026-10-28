<script setup lang="ts">
import { House, Map, Target, UserRound } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { TRANCHE_LIBELLES } from '@/content/schema'
import { useProgress } from '@/store/useProgress'
import LogoBouclier from './LogoBouclier.vue'

const store = useProgress()
const route = useRoute()

/** Menu principal ; une rubrique couvre aussi ses pages filles (une île est dans « Parcours »). */
const RUBRIQUES = [
  { nom: 'Accueil', vers: '/', pages: ['accueil'], icone: House },
  { nom: 'Parcours', vers: '/carte', pages: ['carte', 'ile'], icone: Map },
  { nom: 'Défis', vers: '/defis', pages: ['defis'], icone: Target },
  { nom: 'Profil', vers: '/profil', pages: ['profil'], icone: UserRound },
] as const
const courante = computed(() => RUBRIQUES.find((r) => (r.pages as readonly string[]).includes(String(route.name)))?.vers)
const MODES_LIBELLES = { solo: 'Solo', binome: 'Binôme', classe: 'Classe entière' } as const
</script>

<template>
  <div class="barre-laterale">
    <div class="barre-interieur">
      <RouterLink to="/" class="logo">
        <LogoBouclier :taille="36" /> <span>Cyber <b>Réflexes</b></span>
      </RouterLink>
      <div v-if="store.etat.tranche" class="niveau">
        <p class="surtitre">Ton niveau</p>
        <p class="niveau-valeur">{{ TRANCHE_LIBELLES[store.etat.tranche] }}</p>
        <p v-if="store.etat.mode" class="niveau-mode">{{ MODES_LIBELLES[store.etat.mode] }}</p>
      </div>
      <nav aria-label="Menu principal">
        <ul class="menu">
          <li v-for="r in RUBRIQUES" :key="r.vers">
            <RouterLink
              :to="r.vers"
              class="menu-lien"
              :class="{ actif: courante === r.vers }"
              :aria-current="courante === r.vers ? 'page' : undefined"
            >
              <component :is="r.icone" aria-hidden="true" :size="20" /> {{ r.nom }}
            </RouterLink>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.barre-laterale { background: var(--surface-2); border-right: 1px solid var(--bord); }
.barre-interieur { display: flex; flex-direction: column; gap: 1.25rem; padding: 1rem 0.9rem; }
.logo {
  display: inline-flex; align-items: center; gap: 0.55rem; min-height: 44px; padding-inline: 0.4rem;
  font-family: var(--police-titres); font-weight: 700; font-size: 1.1em; letter-spacing: -0.02em;
  color: var(--texte); text-decoration: none;
}
.logo b { color: var(--primaire); font-weight: 700; }
.niveau { padding: 0.75rem 0.9rem; background: var(--surface); border: 1px solid var(--bord); border-radius: 14px; }
.niveau p { margin: 0; }
.niveau-valeur { font-weight: 600; }
.niveau-mode { color: var(--texte-doux); font-size: 0.85em; }
.menu { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.25rem; }
.menu-lien {
  display: flex; align-items: center; gap: 0.75rem; min-height: 44px; padding: 0.5rem 0.75rem;
  border-radius: 12px; color: var(--texte-doux); font-weight: 500; text-decoration: none;
}
.menu-lien:hover { color: var(--texte); background: var(--surface); }
.menu-lien.actif { color: var(--texte); background: var(--surface); font-weight: 600; box-shadow: var(--ombre-carte); }
.menu-lien.actif::after { content: ''; margin-left: auto; width: 6px; height: 6px; border-radius: 50%; background: var(--primaire); }

/* Grand écran : colonne fixe à gauche. Sinon, bandeau en haut, menu sur une ligne. */
@media (min-width: 64rem) {
  .barre-interieur { position: sticky; top: 0; max-height: 100vh; overflow-y: auto; }
}
@media (max-width: 63.99rem) {
  .barre-laterale { border-right: 0; border-bottom: 1px solid var(--bord); }
  .barre-interieur { flex-direction: row; flex-wrap: wrap; align-items: center; gap: 0.5rem 1rem; padding-block: 0.5rem; }
  .niveau { display: none; }
  .menu { display: flex; flex-wrap: wrap; }
}
</style>
