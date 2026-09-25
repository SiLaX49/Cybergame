import { describe, expect, it } from 'vitest'
import { titrePage } from '@/router'
import { routerTest } from './router-test'

describe('routeur', () => {
  it('résout l’accueil', async () => {
    const router = await routerTest('/')
    expect(router.currentRoute.value.name).toBe('accueil')
  })

  it.each([
    ['/', 'Cyber Réflexes'],
    ['/enseignants', 'Espace enseignants · Cyber Réflexes'],
    ['/confidentialite', 'Confidentialité · Cyber Réflexes'],
    ['/mission/p-6e-colis', 'Le colis mystère · Cyber Réflexes'],
    ['/enseignants/p-6e-colis', 'Le colis mystère : fiche enseignant · Cyber Réflexes'],
    ['/enseignants/p-6e-colis/plan-b', 'Le colis mystère : version papier · Cyber Réflexes'],
    ['/mission/disparue', 'Mission introuvable · Cyber Réflexes'],
    ['/nimporte/quoi', 'Page introuvable · Cyber Réflexes'],
  ])('titre de la page pour %s', async (chemin, titre) => {
    const router = await routerTest(chemin)
    expect(titrePage(router.currentRoute.value)).toBe(titre)
  })

  it('envoie les chemins inconnus vers la page introuvable', async () => {
    const router = await routerTest('/nimporte/quoi')
    expect(router.currentRoute.value.name).toBe('introuvable')
  })
})
