import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { gardeIle, routes } from '@/router'

export async function routerTest(chemin = '/'): Promise<Router> {
  const router = createRouter({ history: createMemoryHistory(), routes })
  router.beforeEach(gardeIle)
  await router.push(chemin)
  await router.isReady()
  return router
}
