import { createRouter, createWebHashHistory, type RouteLocationNormalized, type RouteRecordRaw } from 'vue-router'
import { nomIle } from '@/archipel/archipel'
import { getMission, getTheme } from '@/content'
import AccueilPage from '@/pages/AccueilPage.vue'
import CartePage from '@/pages/CartePage.vue'
import ConfidentialitePage from '@/pages/ConfidentialitePage.vue'
import EnseignantsPage from '@/pages/EnseignantsPage.vue'
import FicheMissionPage from '@/pages/FicheMissionPage.vue'
import IlePage from '@/pages/IlePage.vue'
import IntrouvablePage from '@/pages/IntrouvablePage.vue'
import MissionPage from '@/pages/MissionPage.vue'
import PlanBPage from '@/pages/PlanBPage.vue'
import TestTechniquePage from '@/pages/TestTechniquePage.vue'
import { useProgress } from '@/store/useProgress'

declare module 'vue-router' {
  interface RouteMeta {
    /** Titre de l'onglet ; `{mission}` est remplacé par le titre de la mission de l'URL, `{ile}` par le nom de l'île. */
    titre?: string
  }
}

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'accueil', component: AccueilPage },
  {
    path: '/carte',
    name: 'carte',
    component: CartePage,
    beforeEnter: () => (useProgress().etat.tranche ? true : { name: 'accueil' }),
    meta: { titre: 'Choisis une île' },
  },
  {
    path: '/ile/:theme',
    name: 'ile',
    component: IlePage,
    meta: { titre: '{ile}' },
  },
  { path: '/mission/:id', name: 'mission', component: MissionPage, meta: { titre: '{mission}' } },
  { path: '/enseignants', name: 'enseignants', component: EnseignantsPage, meta: { titre: 'Espace enseignants' } },
  { path: '/enseignants/:id', name: 'fiche', component: FicheMissionPage, meta: { titre: '{mission} : fiche enseignant' } },
  { path: '/enseignants/:id/plan-b', name: 'plan-b', component: PlanBPage, meta: { titre: '{mission} : version papier' } },
  { path: '/confidentialite', name: 'confidentialite', component: ConfidentialitePage, meta: { titre: 'Confidentialité' } },
  { path: '/test', name: 'test-technique', component: TestTechniquePage, meta: { titre: 'Test technique du poste' } },
  { path: '/:chemin(.*)*', name: 'introuvable', component: IntrouvablePage, meta: { titre: 'Page introuvable' } },
]

/** Titre de l'onglet pour une route : « <titre> · Cyber Réflexes » (WCAG 2.4.2). */
export function titrePage(route: RouteLocationNormalized): string {
  const modele = route.meta.titre
  if (!modele) return 'Cyber Réflexes'
  let titre = modele
  if (modele.includes('{mission}')) {
    const mission = getMission(String(route.params.id))
    titre = mission ? modele.replace('{mission}', mission.titre) : 'Mission introuvable'
  }
  if (modele.includes('{ile}')) titre = modele.replace('{ile}', nomIle(String(route.params.theme)) ?? 'Île introuvable')
  return `${titre} · Cyber Réflexes`
}

/**
 * Garde de `/ile/:theme`, globale (et non `beforeEnter`, ignoré quand seul le paramètre change) :
 * sans tranche → accueil ; thème inconnu ou sans île → page introuvable.
 */
export function gardeIle(to: RouteLocationNormalized) {
  if (to.name !== 'ile') return true
  if (!useProgress().etat.tranche) return { name: 'accueil' }
  const theme = String(to.params.theme)
  return getTheme(theme) && nomIle(theme) ? true : { name: 'introuvable', params: { chemin: ['ile', theme] } }
}

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(gardeIle)

router.afterEach((to) => {
  document.title = titrePage(to)
})
