import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AccueilPage from '@/pages/AccueilPage.vue'
import CartePage from '@/pages/CartePage.vue'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

vi.mock('@/content', async () => (await import('./content-mock')).contentMock)

let store: ProgressStore
beforeEach(() => {
  store = creerStore(new MemoryStorage())
  definirStore(store)
})
afterEach(() => vi.useRealTimers())

describe('AccueilPage', () => {
  it('attend le niveau et le mode avant de lancer', async () => {
    const router = await routerTest('/')
    const w = mount(AccueilPage, { global: { plugins: [router] } })
    const lancer = w.find('button[type="submit"]')
    expect(lancer.attributes('disabled')).toBeDefined()
    await w.find('input[name="tranche"][value="6e"]').setValue()
    await w.find('input[name="mode"][value="binome"]').setValue()
    expect(store.etat).toMatchObject({ tranche: '6e', mode: 'binome' })
    expect(lancer.attributes('disabled')).toBeUndefined()
    await w.find('form').trigger('submit')
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('carte'))
  })

  it('propose « Continuer » quand une mission a déjà été jouée', async () => {
    store.enregistrerMission('m-test', [], {})
    const w = mount(AccueilPage, { global: { plugins: [await routerTest('/')] } })
    expect(w.find('button[type="submit"]').text()).toBe('Continuer')
  })
})

describe('CartePage', () => {
  it('renvoie vers l’accueil sans niveau choisi', async () => {
    const router = await routerTest('/carte')
    expect(router.currentRoute.value.name).toBe('accueil')
  })

  it('liste les thèmes, les missions de la tranche et les thèmes à venir', async () => {
    store.choisirTranche('6e')
    const w = mount(CartePage, { global: { plugins: [await routerTest('/carte')] } })
    expect(w.findAll('h2').map((h) => h.text())).toEqual(
      expect.arrayContaining(['Phishing et arnaques', 'Jeux et achats', 'Cyberharcèlement']),
    )
    expect(w.find('a[href="#/mission/m-test"]').exists() || w.find('a[href="/mission/m-test"]').exists()).toBe(true)
    expect(w.text()).toContain('Bientôt disponible')
    expect(w.text()).not.toContain('Terminée')
  })

  it('marque les missions terminées', async () => {
    store.choisirTranche('6e')
    store.enregistrerMission('m-test', ['mission-accomplie'], {})
    const w = mount(CartePage, { global: { plugins: [await routerTest('/carte')] } })
    expect(w.text()).toContain('Terminée')
  })

  it('met le rappel en avant à J+7', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-20T10:00:00Z'))
    store.choisirTranche('6e')
    store.enregistrerMission('m-test', [], {}, new Date('2026-09-10T10:00:00Z'))
    const w = mount(CartePage, { global: { plugins: [await routerTest('/carte')] } })
    expect(w.find('.rappel').classes()).toContain('rappel-du')
    expect(w.text()).toContain('C’est le moment de ton rappel (J+7)')
  })

  it('ignore une progression qui cite une mission disparue', async () => {
    store.choisirTranche('6e')
    store.enregistrerMission('ancienne-mission', ['mission-accomplie'], {})
    const w = mount(CartePage, { global: { plugins: [await routerTest('/carte')] } })
    expect(w.text()).toContain('Phishing et arnaques')
    expect(w.text()).not.toContain('Terminée')
  })
})
