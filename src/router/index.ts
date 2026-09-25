import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import AccueilPage from '@/pages/AccueilPage.vue'
import CartePage from '@/pages/CartePage.vue'
import IntrouvablePage from '@/pages/IntrouvablePage.vue'
import MissionPage from '@/pages/MissionPage.vue'
import { useProgress } from '@/store/useProgress'

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'accueil', component: AccueilPage },
  {
    path: '/carte',
    name: 'carte',
    component: CartePage,
    beforeEnter: () => (useProgress().etat.tranche ? true : { name: 'accueil' }),
  },
  { path: '/mission/:id', name: 'mission', component: MissionPage },
  { path: '/:chemin(.*)*', name: 'introuvable', component: IntrouvablePage },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
