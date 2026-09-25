import { mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MissionPage from '@/pages/MissionPage.vue'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import { cliquer } from './helpers'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

vi.mock('@/content', async () => (await import('./content-mock')).contentMock)

let store: ProgressStore
let erreurs: unknown[]
beforeEach(() => {
  store = creerStore(new MemoryStorage())
  definirStore(store)
  erreurs = []
})

async function monter(id: string) {
  const router = await routerTest(`/mission/${id}`)
  return mount(MissionPage, {
    global: { plugins: [router], config: { errorHandler: (e) => erreurs.push(e) } },
  })
}

async function finirTri(w: VueWrapper) {
  for (let i = 0; i < 4; i++) {
    await w.find('.tri-categories button').trigger('click')
    await cliquer(w, i === 3 ? 'Terminer le mini-jeu' : 'Suivant')
  }
}

describe('MissionPage', () => {
  it('se joue depuis un lien direct, sans niveau ni mode choisis, puis enregistre la mission', async () => {
    const w = await monter('m-test')
    expect(w.find('h1').text()).toBe('Mission test')
    expect(w.text()).toContain('Étape 1 sur 2')
    expect(w.text()).not.toContain('Valider le choix de la classe')
    await w.find('[data-choix="aide"]').trigger('click')
    await cliquer(w, 'Je ne sais pas')
    await cliquer(w, 'Continuer')
    expect(w.text()).toContain('Étape 2 sur 2')
    await finirTri(w)
    expect(w.text()).toContain('Mission terminée !')
    expect(w.text()).toContain('Mission accomplie')
    expect(store.etat.missions['m-test']).toMatchObject({
      badges: ['mission-accomplie', 'reflexe-verif'],
      choix: { 'sc-1': 'aide' },
    })
  })

  it('ignore le double clic sur « Continuer »', async () => {
    const w = await monter('m-test')
    await w.find('[data-choix="aide"]').trigger('click')
    await cliquer(w, 'Je ne sais pas')
    const continuer = w.findAll('button').find((b) => b.text() === 'Continuer')!
    void continuer.trigger('click')
    await continuer.trigger('click')
    expect(erreurs).toEqual([])
    expect(w.text()).toContain('Carte 1 sur 4')
  })

  it('recommence à l’étape 1 après un rechargement en pleine mission', async () => {
    const w = await monter('m-test')
    await w.find('[data-choix="aide"]').trigger('click')
    w.unmount()
    const w2 = await monter('m-test')
    expect(w2.text()).toContain('Étape 1 sur 2')
    expect(w2.find('[data-choix="aide"]').exists()).toBe(true)
  })

  it('permet de rejouer la mission depuis la fin', async () => {
    const w = await monter('m-test')
    await w.find('[data-choix="aide"]').trigger('click')
    await cliquer(w, 'Je ne sais pas')
    await cliquer(w, 'Continuer')
    await finirTri(w)
    await cliquer(w, 'Rejouer la mission')
    expect(w.text()).toContain('Étape 1 sur 2')
  })

  it('affiche un message clair pour une mission inconnue', async () => {
    const w = await monter('mission-disparue')
    expect(w.find('h1').text()).toBe('Cette mission n’existe plus')
  })

  it('thème sensible : avertissement, bandeau d’aide et bouton passer', async () => {
    const w = await monter('m-sensible')
    expect(w.text()).toContain('Ce sujet peut être difficile')
    expect(w.find('[data-choix="aide"]').exists()).toBe(false)
    expect(w.find('aside').text()).toContain('3018')
    await cliquer(w, 'Commencer')
    await cliquer(w, 'Passer ce scénario')
    expect(w.text()).toContain('Étape 2 sur 2')
    expect(w.find('aside').text()).toContain('3018')
  })

  it('mission rappel : révèle le piège et enregistre le résultat', async () => {
    const w = await monter('r-test')
    for (const n of ['n1', 'n2', 'n3']) await w.find(`input[name="notif-${n}"][value="ouvrir"]`).setValue()
    await w.find('form').trigger('submit')
    expect(w.text()).toContain('Le message piège était')
    expect(w.text()).toContain('Frais de douane : payez 2,99 € ici')
    expect(w.text()).toContain('Tu as ouvert ce message piège')
    expect(store.etat.rappels['r-test']).toMatchObject({ fois: 1, resultatSurprise: 'piege' })
    expect(store.etat.missions['r-test']).toBeUndefined()
  })

  it('ouvre les questions de débrief en grand', async () => {
    const w = await monter('m-test')
    await w.find('[data-choix="aide"]').trigger('click')
    await cliquer(w, 'Je ne sais pas')
    await cliquer(w, 'Continuer')
    await finirTri(w)
    await cliquer(w, 'Afficher les questions en grand')
    expect(w.find('dialog').text()).toContain('Q1 ?')
    await cliquer(w.find('dialog'), 'Fermer')
    expect(w.find('dialog').exists()).toBe(false)
  })
})
