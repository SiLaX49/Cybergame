import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CHEMIN, ILES_CALMES } from '@/archipel/archipel'
import CartePage from '@/pages/CartePage.vue'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import { themesFixture } from './fixtures'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

vi.mock('@/content', async () => (await import('./content-mock')).contentMock)

let store: ProgressStore
beforeEach(() => {
  store = creerStore(new MemoryStorage())
  definirStore(store)
})

async function monterCarte(tranche: '6e' | 'lycee' = '6e') {
  store.choisirTranche(tranche)
  store.choisirMode('solo')
  return mount(CartePage, { global: { plugins: [await routerTest('/carte')] } })
}

describe('carte de l’archipel', () => {
  it('titre « Choisis une île » et archipel par défaut', async () => {
    const w = await monterCarte()
    expect(w.find('h1').text()).toBe('Choisis une île')
    expect(w.find('.archipel').exists()).toBe(true)
    expect(w.find('.grille-themes').exists()).toBe(false)
  })

  it('les îles du chemin d’abord, dans l’ordre, puis le lagon', async () => {
    const w = await monterCarte()
    const ordre = w.findAll('a.ile-lien').map((a) => a.attributes('data-theme'))
    const ids = themesFixture().map((t) => t.id)
    const attendus = [...CHEMIN, ...ILES_CALMES].filter((t) => ids.includes(t))
    expect(ordre).toEqual(attendus)
    expect(w.find('.lagon h2').text()).toBe('Lagon calme')
  })

  it('personnage au port au départ, puis sur la dernière île jouée', async () => {
    store.choisirPersonnage('p1')
    const w = await monterCarte()
    expect(w.find('.port .hulotte, .port .ile-perso').exists()).toBe(true)
    expect(w.findAll('a.ile-lien').some((a) => a.attributes('aria-label')!.includes('tu es ici'))).toBe(false)
    w.unmount()
    store.enregistrerMission('m-test', ['mission-accomplie'], {})
    const w2 = await monterCarte()
    expect(w2.find('a.ile-lien[data-theme="phishing"]').attributes('aria-label')).toContain('tu es ici')
    expect(w2.find('.port .ile-perso').exists()).toBe(false)
  })

  it('bascule vers la vue liste et mémorise le choix', async () => {
    const w = await monterCarte()
    const b = w.find('button.bascule-vue')
    expect(b.attributes('aria-pressed')).toBe('false')
    expect(b.text()).toContain('Vue liste')
    await b.trigger('click')
    expect(store.etat.reglages.vueCarte).toBe('liste')
    expect(w.find('.grille-themes').exists()).toBe(true)
    expect(w.find('button.bascule-vue').text()).toContain('Vue liste')
    expect(w.find('button.bascule-vue').attributes('aria-pressed')).toBe('true')
  })

  it('pas de sacoche sans parcours dans la tranche', async () => {
    const w = await monterCarte('lycee')
    expect(w.find('.sacoche').exists()).toBe(false)
  })
})
