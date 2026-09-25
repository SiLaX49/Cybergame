import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import AccueilPage from '@/pages/AccueilPage.vue'
import CartePage from '@/pages/CartePage.vue'
import ConfidentialitePage from '@/pages/ConfidentialitePage.vue'
import EnseignantsPage from '@/pages/EnseignantsPage.vue'
import FicheMissionPage from '@/pages/FicheMissionPage.vue'
import IntrouvablePage from '@/pages/IntrouvablePage.vue'
import PlanBPage from '@/pages/PlanBPage.vue'
import TestTechniquePage from '@/pages/TestTechniquePage.vue'
import { useProgress } from '@/store/useProgress'

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'accueil', component: AccueilPage },
  {
    path: '/carte',
    name: 'carte',
    component: CartePage,
    beforeEnter: () => (useProgress().etat.tranche ? true : { name: 'accueil' }),
  },
  { path: '/enseignants', name: 'enseignants', component: EnseignantsPage },
  { path: '/enseignants/:id', name: 'fiche', component: FicheMissionPage },
  { path: '/enseignants/:id/plan-b', name: 'plan-b', component: PlanBPage },
  { path: '/confidentialite', name: 'confidentialite', component: ConfidentialitePage },
  { path: '/test', name: 'test-technique', component: TestTechniquePage },
  { path: '/:chemin(.*)*', name: 'introuvable', component: IntrouvablePage },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
