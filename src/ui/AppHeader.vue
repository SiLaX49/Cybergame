<script setup lang="ts">
import { Trophy } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { solde } from '@/engine/portefeuille'
import { useProgress } from '@/store/useProgress'
import EnTete from './EnTete.vue'
import LogoBouclier from './LogoBouclier.vue'
import Octets from './Octets.vue'

const store = useProgress()
const route = useRoute()

/** Menu principal ; une rubrique couvre aussi ses pages filles (une île est dans « Parcours »). */
const RUBRIQUES = [
  { nom: 'Accueil', vers: '/', pages: ['accueil'] },
  { nom: 'Parcours', vers: '/carte', pages: ['carte', 'ile'] },
  { nom: 'Défis', vers: '/defis', pages: ['defis'] },
  { nom: 'Profil', vers: '/profil', pages: ['profil'] },
] as const
const courante = computed(() => RUBRIQUES.find((r) => (r.pages as readonly string[]).includes(String(route.name)))?.vers)
const reserve = computed(() => solde(store.etat))
</script>

<template>
  <EnTete classe="app-header">
    <template #gauche>
      <RouterLink to="/" class="logo">
        <LogoBouclier :taille="40" /> <span class="logo-texte">Cyber <b>Réflexes</b></span>
      </RouterLink>
    </template>
    <template #centre>
      <nav aria-label="Menu principal" class="menu">
        <RouterLink
          v-for="r in RUBRIQUES"
          :key="r.vers"
          :to="r.vers"
          class="menu-lien"
          :class="{ actif: courante === r.vers }"
          :aria-current="courante === r.vers ? 'page' : undefined"
        >
          {{ r.nom }}
        </RouterLink>
      </nav>
      <RouterLink to="/profil" class="reserve">
        <span class="visually-hidden">Ta réserve : </span><Octets :valeur="reserve" /> <Trophy aria-hidden="true" class="reserve-trophee" />
      </RouterLink>
    </template>
  </EnTete>
</template>

<style scoped>
.logo {
  display: inline-flex; align-items: center; gap: 0.55rem; min-height: 44px;
  font-family: var(--police-titres); font-weight: 700; font-size: 1.05em; line-height: 1.05;
  text-transform: uppercase; letter-spacing: 0.04em;
  color: var(--texte); text-decoration: none;
}
.logo-texte { max-width: 6.5em; }
.logo b { color: var(--primaire); }
.menu { display: flex; flex-wrap: wrap; gap: 0.25rem 1.25rem; margin-inline: auto; }
.menu-lien {
  display: inline-flex; align-items: center; min-height: 44px; padding: 0 0.15rem;
  font-family: var(--police-titres); font-weight: 600; color: var(--texte-doux); text-decoration: none;
  border-bottom: 3px solid transparent;
}
.menu-lien:hover { color: var(--texte); }
.menu-lien.actif { color: var(--texte); border-bottom-color: var(--primaire); }
.reserve {
  display: inline-flex; align-items: center; gap: 0.4rem; min-height: 44px; padding: 0.2rem 0.9rem;
  border-radius: 999px; background: var(--surface-2); border: 2px solid var(--bord); text-decoration: none;
}
.reserve-trophee { color: var(--or); }
</style>
