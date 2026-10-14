<script setup lang="ts">
import { Check } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { estIleCalme, infoIle, nomIle } from '@/archipel/archipel'
import IleDessin from '@/archipel/IleDessin.vue'
import { compteurIle } from '@/archipel/libelles'
import { etatIle } from '@/archipel/progression'
import { getTheme, missionsPour } from '@/content'
import type { Tranche } from '@/content/schema'
import { AVERTISSEMENT } from '@/mission/textesSensibles'
import { useProgress } from '@/store/useProgress'
import Hulotte from '@/ui/Hulotte.vue'

// La page est recréée à chaque changement d’URL (RouterView :key) ; la garde du routeur garantit un thème connu,
// et la page le vérifie quand même (jamais d’île « par défaut »).
const themeId = String(useRoute().params.theme)
const store = useProgress()
const theme = getTheme(themeId)
const nom = nomIle(themeId)
const calme = estIleCalme(themeId)
const sensible = theme?.sensible ?? false
const objet = infoIle(themeId)?.objet

const tranche = computed<Tranche>(() => store.etat.tranche ?? '6e')
const missions = computed(() => {
  const toutes = missionsPour(tranche.value, themeId)
  return [...toutes.filter((m) => m.format === 'parcours'), ...toutes.filter((m) => m.format !== 'parcours')]
})
const etat = computed(() => etatIle(missions.value, store.etat.missions, calme))
const terminee = (id: string) => id in store.etat.missions
</script>

<template>
  <main v-if="theme && nom" class="conteneur ile">
    <RouterLink class="btn btn-discret" to="/carte">Retour à l’archipel</RouterLink>

    <header class="carte ile-entete">
      <IleDessin :theme="themeId" class="ile-grande" />
      <div class="ile-titres">
        <h1>{{ nom }}</h1>
        <p class="sous-titre">{{ theme.titre }}</p>
        <p class="description">{{ theme.description }}</p>
        <p class="ile-badges">
          <template v-if="!calme && objet">
            <span v-if="etat.aParcours && etat.objetGagne" class="badge badge-bon">{{ objet.emoji }} {{ objet.nom }} gagné</span>
            <span v-else-if="etat.aParcours" class="badge">{{ objet.emoji }} {{ objet.nom }} : pas encore</span>
            <span v-else class="badge">Parcours bientôt</span>
          </template>
          <span v-if="missions.length > 0" class="meta">{{ compteurIle(etat) }}</span>
        </p>
      </div>
    </header>

    <p v-if="missions.length === 0" class="bientot-ile">Bientôt disponible</p>

    <section v-if="sensible && missions.length > 0" class="encadre encadre-doux avertissement-ile">
      <Hulotte expression="douce" :taille="64" />
      <div>
        <p v-for="p in AVERTISSEMENT.paragraphes" :key="p">{{ p }}</p>
      </div>
    </section>

    <h2 v-if="missions.length > 0" class="titre-missions">Missions</h2>
    <ul v-if="missions.length > 0" class="missions-ile">
      <li v-for="m in missions" :key="m.id" class="carte">
        <RouterLink :to="`/mission/${m.id}`">{{ m.titre }}</RouterLink>
        <span v-if="m.format === 'parcours'" class="badge">Parcours</span>
        <span class="meta">{{ m.duree }} min</span>
        <span v-if="terminee(m.id)" class="badge badge-bon"><Check aria-hidden="true" :size="16" /> Terminée</span>
      </li>
    </ul>

    <RouterLink class="btn" to="/carte">Retour à l’archipel</RouterLink>
  </main>
  <main v-else class="conteneur ile">
    <h1>Île introuvable</h1>
    <RouterLink class="btn" to="/carte">Retour à l’archipel</RouterLink>
  </main>
</template>

<style scoped>
.ile { display: grid; gap: 1rem; justify-items: start; }
.ile > * { margin: 0; }
.ile-entete { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; width: 100%; box-sizing: border-box; }
.ile-grande { width: 10rem; max-width: 100%; height: auto; flex: none; }
.ile-titres { min-width: 0; flex: 1 1 14rem; }
.ile-titres h1 { margin: 0; }
.sous-titre { margin: 0.25rem 0 0.25rem; }
.description { margin: 0 0 0.5rem; }
.titre-missions { font-size: 1.2em; margin-bottom: 0; }
.bientot-ile { font-weight: 700; }
.ile-badges { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin: 0; }
.avertissement-ile { display: flex; align-items: flex-start; gap: 1rem; width: 100%; box-sizing: border-box; }
.avertissement-ile > :first-child { flex: none; }
.missions-ile { list-style: none; padding: 0; display: grid; gap: 0.75rem; width: 100%; }
.missions-ile li { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.75rem; }
.missions-ile li a { font-weight: 700; min-height: 44px; display: inline-flex; align-items: center; }
</style>
