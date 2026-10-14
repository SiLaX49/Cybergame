import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AccueilPage from '@/pages/AccueilPage.vue'
import CartePage from '@/pages/CartePage.vue'
import IntrouvablePage from '@/pages/IntrouvablePage.vue'
import { creerStore, definirStore } from '@/store/useProgress'
import AppHeader from '@/ui/AppHeader.vue'
import { themesFixture } from './fixtures'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

vi.mock('@/content', async () => (await import('./content-mock-parcours')).contentMock)

let store: ReturnType<typeof creerStore>
beforeEach(() => {
  store = creerStore(new MemoryStorage())
  definirStore(store)
})

describe('refonte : coquille et pages', () => {
  it('l’en-tête a le logo Hulotte et un bouton Réglages secondaire', async () => {
    const w = mount(AppHeader, { global: { plugins: [await routerTest('/')] } })
    expect(w.find('.logo svg.hulotte').exists()).toBe(true)
    expect(w.find('.logo').text()).toContain('Cyber Réflexes')
    expect(w.find('button[aria-controls="panneau-reglages"]').classes()).toContain('btn-secondaire')
  })

  it('l’accueil montre Hulotte et un titre de niveau 1', async () => {
    const w = mount(AccueilPage, { global: { plugins: [await routerTest('/')] } })
    expect(w.find('svg.hulotte[data-expression="accueil"]').exists()).toBe(true)
    expect(w.find('h1').text().length).toBeGreaterThan(0)
  })

  it('la carte a une tuile par thème, avec pastille et accent', async () => {
    store.choisirTranche('6e')
    store.modifierReglages({ vueCarte: 'liste' })
    const w = mount(CartePage, { global: { plugins: [await routerTest('/carte')] } })
    expect(w.find('svg.hulotte[data-expression="reflechit"]').exists()).toBe(true)
    const themes = themesFixture()
    const tuiles = w.findAll('.tuile')
    expect(tuiles.length).toBe(themes.length)
    for (const [i, t] of tuiles.entries()) {
      expect(t.attributes('data-accent')).toBe(themes[i]!.id)
      expect(t.find('.pastille-theme').exists()).toBe(true)
    }
    expect(w.findAll('.badge').some((b) => b.text() === 'Parcours')).toBe(true)
  })

  it('la page introuvable montre Hulotte', async () => {
    const w = mount(IntrouvablePage, { global: { plugins: [await routerTest('/x')] } })
    expect(w.find('svg.hulotte[data-expression="reflechit"]').exists()).toBe(true)
    expect(w.text()).toContain('Page introuvable')
  })
})
