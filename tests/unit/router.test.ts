import { describe, expect, it } from 'vitest'
import { routerTest } from './router-test'

describe('routeur', () => {
  it(`résout l'accueil`, async () => {
    const router = await routerTest('/')
    expect(router.currentRoute.value.name).toBe('accueil')
  })

  it('envoie les chemins inconnus vers la page introuvable', async () => {
    const router = await routerTest('/nimporte/quoi')
    expect(router.currentRoute.value.name).toBe('introuvable')
  })
})
