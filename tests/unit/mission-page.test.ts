import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App.vue'
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
  // Séquence de retour instantanée : le panneau suit le choix sans minuterie.
  store.modifierReglages({ animations: false })
  erreurs = []
})

async function monter(id: string, attachTo?: HTMLElement) {
  const router = await routerTest(`/mission/${id}`)
  return mount(MissionPage, {
    attachTo,
    global: { plugins: [router], config: { errorHandler: (e) => erreurs.push(e) } },
  })
}

/** Joue un choix du téléphone, puis attend la fin (instantanée) de la séquence et l’affichage du panneau. */
async function choisir(w: VueWrapper, id: string) {
  await w.find(`[data-choix="${id}"]`).trigger('click')
  await flushPromises()
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
    await choisir(w, 'aide')
    await cliquer(w, 'Continuer')
    expect(w.text()).toContain('Étape 2 sur 2')
    await finirTri(w)
    expect(w.text()).toContain('Mission terminée !')
    expect(w.text()).toContain('Mission accomplie')
    expect(store.etat.missions['m-test']).toMatchObject({
      badges: ['mission-accomplie', 'oeil-de-lynx', 'reflexe-verif'],
      choix: { 'sc-1': 'aide' },
    })
  })

  it('ignore le double clic sur « Continuer »', async () => {
    const w = await monter('m-test')
    await choisir(w, 'aide')
    const continuer = w.findAll('button').find((b) => b.text() === 'Continuer')!
    void continuer.trigger('click')
    await continuer.trigger('click')
    expect(erreurs).toEqual([])
    expect(w.text()).toContain('Carte 1 sur 4')
  })

  it('recommence à l’étape 1 après un rechargement en pleine mission', async () => {
    const w = await monter('m-test')
    await choisir(w, 'aide')
    w.unmount()
    const w2 = await monter('m-test')
    expect(w2.text()).toContain('Étape 1 sur 2')
    expect(w2.find('[data-choix="aide"]').exists()).toBe(true)
  })

  it('permet de rejouer la mission depuis la fin', async () => {
    const w = await monter('m-test')
    await choisir(w, 'aide')
    await cliquer(w, 'Continuer')
    await finirTri(w)
    await cliquer(w, 'Rejouer la mission')
    expect(w.text()).toContain('Étape 1 sur 2')
  })

  it('« Rejouer ce scénario » : retour à la question, puis un nouveau choix se joue jusqu’au bout', async () => {
    const w = await monter('m-test')
    await choisir(w, 'verif')
    await cliquer(w, 'Rejouer ce scénario')
    expect(w.find('h2').text()).toBe('Que fais-tu ?')
    expect(w.find('.choix-joue').text()).toBe('')
    await choisir(w, 'aide')
    expect(w.find('.choix-joue').text()).toContain('demander de l’aide')
    expect(w.text()).toContain('Ta mère confirme : arnaque.')
    await cliquer(w, 'Continuer')
    expect(w.text()).toContain('Étape 2 sur 2')
  })

  it('le bouton « Indice » du téléphone est relayé au moteur et reste enfoncé', async () => {
    const w = await monter('m-test')
    await cliquer(w, 'Indice')
    expect(w.find('button[aria-pressed="true"]').text()).toBe('Indice')
    expect(w.find('.ecran .passage').text()).toContain('colis-expres.info')
    expect(erreurs).toEqual([])
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
    for (const n of ['n1', 'n2', 'n3']) {
      await w.find(`[data-notif="${n}"]`).trigger('click')
      await cliquer(w, 'J’ouvre / je clique')
    }
    await cliquer(w, 'Valider mes choix')
    expect(w.text()).toContain('Le message piège était')
    expect(w.text()).toContain('Frais de douane : payez 2,99 € ici')
    expect(w.text()).toContain('Tu as ouvert ce message piège')
    expect(store.etat.rappels['r-test']).toMatchObject({ fois: 1, resultatSurprise: 'piege' })
    expect(store.etat.missions['r-test']).toBeUndefined()
  })

  it('ouvre les questions de débrief en grand', async () => {
    const w = await monter('m-test')
    await choisir(w, 'aide')
    await cliquer(w, 'Continuer')
    await finirTri(w)
    await cliquer(w, 'Afficher les questions en grand')
    expect(w.find('dialog').text()).toContain('Q1 ?')
    await cliquer(w.find('dialog'), 'Fermer')
    expect(w.find('dialog').exists()).toBe(false)
  })

  it('chemin risqué : pourquoi, réponse, récupération, puis « Ce qui t’a fait craquer »', async () => {
    const w = await monter('m-test')
    await choisir(w, 'clic')
    expect(w.find('h2').text()).toBe('Qu’est-ce qui t’a donné envie de le faire ?')
    await w.find('[data-levier="urgence"]').trigger('click')
    expect(w.text()).toContain('Ce qui a marché sur toi')
    await cliquer(w, 'Continuer')
    await cliquer(w, 'Menu du contact')
    await cliquer(w, 'Bloquer')
    await w.find('input[value="Faux compte"]').setValue()
    await cliquer(w, 'Envoyer le signalement')
    await cliquer(w, 'Continuer')
    await finirTri(w)
    const bloc = w.find('.craquer')
    expect(bloc.text()).toContain('Ce qui t’a fait craquer')
    expect(bloc.text()).toContain('Il fallait faire vite')
    expect(bloc.text()).toContain('Parade Il fallait faire vite.')
  })

  it('ignore le double clic sur une raison', async () => {
    const w = await monter('m-test')
    await choisir(w, 'clic')
    const raison = w.find('[data-levier="reflexe"]')
    void raison.trigger('click')
    await raison.trigger('click')
    expect(erreurs).toEqual([])
    expect(w.text()).toContain('Ce qui a marché sur toi')
  })

  it('sans piège : rappelle les leviers à surveiller', async () => {
    const w = await monter('m-test')
    await choisir(w, 'aide')
    await cliquer(w, 'Continuer')
    await finirTri(w)
    const bloc = w.find('.craquer')
    expect(bloc.text()).toContain('Aucun piège n’a marché sur toi cette fois.')
    expect(bloc.text()).toContain('C’était pas cher, pas grave')
  })

  it('« Rejouer ce scénario » n’efface pas le levier du récapitulatif', async () => {
    const w = await monter('m-test')
    await choisir(w, 'clic')
    await w.find('[data-levier="urgence"]').trigger('click')
    await cliquer(w, 'Rejouer ce scénario')
    await choisir(w, 'aide')
    await cliquer(w, 'Continuer')
    await finirTri(w)
    const bloc = w.find('.craquer')
    expect(bloc.text()).toContain('Il fallait faire vite')
    expect(bloc.text()).not.toContain('Aucun piège n’a marché sur toi cette fois.')
  })

  it('tous les scénarios passés : pas de « Aucun piège n’a marché sur toi »', async () => {
    const w = await monter('m-sensible')
    await cliquer(w, 'Commencer')
    await cliquer(w, 'Passer ce scénario')
    await finirTri(w)
    expect(w.text()).toContain('Mission terminée !')
    expect(w.text()).not.toContain('Aucun piège n’a marché sur toi cette fois.')
    expect(w.find('.craquer').exists()).toBe(false)
  })

  it('mission sans bloc pourquoi : pas de bloc « Ce qui t’a fait craquer »', async () => {
    const w = await monter('r-test')
    for (const n of ['n1', 'n2', 'n3']) {
      await w.find(`[data-notif="${n}"]`).trigger('click')
      await cliquer(w, 'J’ignore')
    }
    await cliquer(w, 'Valider mes choix')
    expect(w.text()).toContain('Mission terminée !')
    expect(w.find('.craquer').exists()).toBe(false)
  })
})

describe('MissionPage : barre unique et mode scène', () => {
  const scene = (w: VueWrapper) => w.find('main').classes().includes('mission--scene')

  it('la barre affiche le titre en h1, la progression et le lien vers la carte, sans lien Enseignants', async () => {
    const w = await monter('m-test')
    const barre = w.find('header.mission-barre')
    expect(barre.find('h1').text()).toBe('Mission test')
    expect(barre.text()).toContain('Étape 1 sur 2')
    expect(barre.find('progress').exists()).toBe(true)
    expect(barre.find('a[href="/carte"]').text()).toContain('Carte')
    expect(w.text()).not.toContain('Enseignants')
  })

  it('« Réglages » ouvre le panneau, la fermeture rend le focus au bouton', async () => {
    const w = await monter('m-test', document.body)
    const reglages = w.find('button[aria-controls="panneau-reglages"]')
    expect(reglages.attributes('aria-expanded')).toBe('false')
    await reglages.trigger('click')
    expect(reglages.attributes('aria-expanded')).toBe('true')
    await cliquer(w.find('#panneau-reglages'), 'Fermer')
    await flushPromises()
    expect(w.find('#panneau-reglages').exists()).toBe(false)
    expect(document.activeElement).toBe(reglages.element)
    w.unmount()
  })

  it('mode scène sur un scénario, pas sur un mini-jeu ni à la fin, où la progression disparaît', async () => {
    const w = await monter('m-test')
    expect(scene(w)).toBe(true)
    await w.find('[data-choix="aide"]').trigger('click')
    await flushPromises()
    await cliquer(w, 'Continuer')
    expect(w.text()).toContain('Étape 2 sur 2')
    expect(scene(w)).toBe(false)
    await finirTri(w)
    expect(w.text()).toContain('Mission terminée !')
    expect(scene(w)).toBe(false)
    expect(w.find('header.mission-barre h1').text()).toBe('Mission test')
    expect(w.find('progress').exists()).toBe(false)
    expect(w.text()).not.toContain('Étape')
  })

  it('mode scène sur le fil de notifications, pas tant que l’avertissement sensible attend', async () => {
    expect(scene(await monter('r-test'))).toBe(true)
    const w = await monter('m-sensible')
    expect(scene(w)).toBe(false)
    await cliquer(w, 'Commencer')
    expect(scene(w)).toBe(true)
  })

  it('en-tête global et pied de page absents sur la route mission, présents ailleurs', async () => {
    const enMission = mount(App, { global: { plugins: [await routerTest('/mission/m-test')] } })
    await flushPromises()
    expect(enMission.find('.app-header').exists()).toBe(false)
    expect(enMission.find('footer.pied').exists()).toBe(false)
    expect(enMission.find('header.mission-barre').exists()).toBe(true)
    const ailleurs = mount(App, { global: { plugins: [await routerTest('/confidentialite')] } })
    await flushPromises()
    expect(ailleurs.find('.app-header').exists()).toBe(true)
    expect(ailleurs.findAll('footer.pied a').map((a) => a.text())).toEqual([
      'Espace enseignants',
      'Confidentialité',
      'Test technique du poste',
    ])
  })

  it('les deux barres partagent le même bouton Réglages', async () => {
    const w = mount(App, { global: { plugins: [await routerTest('/mission/m-test')] } })
    await flushPromises()
    await cliquer(w, 'Réglages')
    expect(w.find('#panneau-reglages').exists()).toBe(true)
    expect(w.find('header.mission-barre button[aria-controls="panneau-reglages"]').attributes('aria-expanded')).toBe('true')
  })
})
