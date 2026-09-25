import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import AccueilPage from '@/pages/AccueilPage.vue'
import IntrouvablePage from '@/pages/IntrouvablePage.vue'

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'accueil', component: AccueilPage },
  { path: '/:chemin(.*)*', name: 'introuvable', component: IntrouvablePage },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
