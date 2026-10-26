import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AccueilPage from '@/pages/AccueilPage.vue'
import DefisPage from '@/pages/DefisPage.vue'
import ProfilPage from '@/pages/ProfilPage.vue'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

vi.mock('@/content', async () => (await import('./content-mock-parcours')).contentMock)

let store: ProgressStore
beforeEach(() => {
  store = creerStore(new MemoryStorage())
  definirStore(store)
})

describe('accueil : tableau de bord', () => {
  beforeEach(() => {
    store.choisirTranche('6e')
    store.choisirMode('solo')
  })

  it('montre l’île en cours, sa progression, ses missions et le défi du jour', async () => {
    const w = mount(AccueilPage, { global: { plugins: [await routerTest('/')] } })
    expect(w.find('h1').text()).toBe('Île aux hameçons : Phishing et arnaques')
    expect(w.find('progress').attributes()).toMatchObject({ value: '0', max: '1' })
    expect(w.find('.pourcentage').text()).toBe('0 %')
    const tuiles = w.findAll('.tuile-mission').map((t) => t.text())
    expect(tuiles[0]).toBe('📩Mission test')
    // Une seule mission sur l’île : le défi du jour complète la grille s’il est ailleurs.
    expect(tuiles.slice(1).every((t) => t.startsWith('🎯Défi du jour : '))).toBe(true)
    expect(w.find('.btn-appel').text()).toBe('Lancer le défi du jour')
    expect(w.find('.btn-appel').attributes('href')).toMatch(/\/mission\//)
    expect(w.findAll('.objectifs li')).toHaveLength(4)
    expect(w.text()).toContain('Classement de tes îles')
    expect(w.find('form').exists()).toBe(false)
  })

  it('passe à l’île suivante quand la première est terminée, et classe les îles par octets', async () => {
    store.enregistrerMission('m-test', [], {})
    store.crediterMission('p-parcours', 40, false)
    const w = mount(AccueilPage, { global: { plugins: [await routerTest('/')] } })
    expect(w.find('h1').text()).toContain('Île aux pièces d’or')
    expect(w.findAll('.classement .nom').map((n) => n.text())).toEqual(['Île aux pièces d’or', 'Île aux hameçons'])
  })

  it('« Changer » rouvre le choix du niveau et du mode', async () => {
    const w = mount(AccueilPage, { global: { plugins: [await routerTest('/')] } })
    await w.find('.changer').trigger('click')
    expect(w.find('form').exists()).toBe(true)
  })
})

describe('page Défis', () => {
  it('propose le défi du jour, son bonus et le barème', async () => {
    store.choisirTranche('6e')
    const w = mount(DefisPage, { global: { plugins: [await routerTest('/defis')] } })
    expect(w.find('h1').text()).toBe('Défis')
    expect(w.find('.defi-jour .btn-appel').text()).toBe('Lancer le défi du jour')
    expect(w.find('table.bareme').text()).toContain('Erreur réparée')
    store.releverDefi()
    await w.vm.$nextTick()
    expect(w.text()).toContain('Défi relevé aujourd’hui')
    expect(w.find('.defi-jour .btn-appel').text()).toBe('Rejouer le défi')
  })

  it('renvoie vers l’accueil sans niveau choisi', async () => {
    const router = await routerTest('/defis')
    expect(router.currentRoute.value.name).toBe('accueil')
  })
})

describe('page Profil et boutique', () => {
  it('achète un titre avec les octets gagnés et le porte', async () => {
    store.crediterMission('m-test', 60, false)
    const w = mount(ProfilPage, { global: { plugins: [await routerTest('/profil')] } })
    expect(w.find('.titre-porte').text()).toBe('Agent·e en formation')
    const article = (nom: string) => w.findAll('.article').find((a) => a.text().includes(nom))!
    const cher = article('Expert·e cyber')
    expect(cher.find('button').attributes('disabled')).toBeDefined()
    expect(cher.text()).toContain('Il te manque 640 octets')
    await article('Apprenti·e prudent·e').find('button').trigger('click')
    expect(store.etat.achats).toEqual(['titre-apprenti'])
    expect(w.find('.titre-porte').text()).toBe('Apprenti·e prudent·e')
    expect(article('Apprenti·e prudent·e').find('button').attributes('aria-pressed')).toBe('true')
    await article('Apprenti·e prudent·e').find('button').trigger('click')
    expect(store.etat.titre).toBeNull()
  })

  it('montre les badges gagnés et permet de changer de personnage', async () => {
    store.enregistrerMission('m-test', ['mission-accomplie', 'reparateur'], {})
    const w = mount(ProfilPage, { global: { plugins: [await routerTest('/profil')] } })
    expect(w.findAll('.medaille').map((b) => b.text())).toEqual(['Mission accomplie × 1', 'Réparateur·rice × 1'])
    await w.find('input[name="personnage-profil"][value="p2"]').setValue()
    expect(store.etat.personnage).toBe('p2')
  })
})
