import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DECORS, type Lieu } from '@/content/schema'
import type { LieuResultat } from '@/engine/mission-runner'
import CheminIle from '@/mission/CheminIle.vue'
import DecorScene from '@/mission/DecorScene.vue'
import LieuStep from '@/mission/LieuStep.vue'
import CartePage from '@/pages/CartePage.vue'
import FicheMissionPage from '@/pages/FicheMissionPage.vue'
import MissionPage from '@/pages/MissionPage.vue'
import PlanBPage from '@/pages/PlanBPage.vue'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import { leviersFixture, parcoursFixture } from './fixtures'
import { cliquer } from './helpers'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

vi.mock('@/content', async () => (await import('./content-mock-parcours')).contentMock)

let store: ProgressStore
beforeEach(() => {
  store = creerStore(new MemoryStorage())
  definirStore(store)
})

const lieu = () => parcoursFixture().etapes[0] as Lieu
const resultat = (r: Partial<LieuResultat> = {}): LieuResultat => ({
  type: 'lieu',
  choixId: 'garde',
  qualite: 'bon',
  levier: null,
  recuperationFaite: null,
  essais: [],
  passe: false,
  ...r,
})
const monterLieu = (props: Record<string, unknown> = {}) =>
  mount(LieuStep, {
    props: { lieu: lieu(), phase: 'situation', mode: 'solo', sensible: false, leviers: leviersFixture(), ...props },
  })

describe('LieuStep', () => {
  it('raconte la situation dans son décor, puis envoie le choix', async () => {
    const w = monterLieu()
    expect(w.find('figcaption').text()).toBe('La cour')
    expect(w.find('svg[data-decor="cour"]').attributes('aria-hidden')).toBe('true')
    expect(w.find('article').attributes('aria-label')).toBe('Lieu : La cour')
    expect(w.text()).toContain('Dans la cour, Lina te dit')
    expect(w.find('h2').text()).toBe('Que fais-tu ?')
    await w.find('[data-choix="aide"]').trigger('click')
    expect(w.emitted('evenement')).toEqual([[{ type: 'choisir', choixId: 'aide' }]])
  })

  it('lecture simplifiée : le récit court remplace le récit complet', () => {
    store.modifierReglages({ lectureSimple: true })
    const w = monterLieu()
    expect(w.text()).not.toContain('Dans la cour')
    expect(w.text()).toContain('Lina te dit')
  })

  it('choix risqué : demande pourquoi', async () => {
    const w = monterLieu({ phase: 'pourquoi' })
    expect(w.find('h2').text()).toBe('Qu’est-ce qui t’a donné envie de le faire ?')
    await w.find('[data-levier="gain"]').trigger('click')
    expect(w.emitted('evenement')).toEqual([[{ type: 'expliquer', levier: 'gain' }]])
  })

  it('réaction après un piège avec récupération : on reste, un seul bouton « Continuer » vers le geste', async () => {
    const w = monterLieu({ phase: 'consequence', resultat: resultat({ choixId: 'donne', qualite: 'risque', levier: 'confiance', essais: ['donne'] }) })
    expect(w.text()).toContain('C’était risqué')
    expect(w.text()).toContain('Tu restes sur ta plateforme.')
    expect(w.text()).toContain('Son frère voit ton mot de passe.')
    expect(w.text()).toContain('Lina est ton amie.')
    expect(w.findAll('button').map((b) => b.text())).toEqual(['Continuer'])
    await cliquer(w, 'Continuer')
    expect(w.emitted('evenement')).toEqual([[{ type: 'continuer' }]])
  })

  it('réaction après un piège sans récupération : seulement « Réessayer »', async () => {
    const sansRecup = { ...lieu(), recuperation: undefined }
    const w = monterLieu({ lieu: sansRecup, phase: 'consequence', resultat: resultat({ choixId: 'donne', qualite: 'risque', levier: 'gain', essais: ['donne'] }) })
    expect(w.findAll('button').map((b) => b.text())).toEqual(['Réessayer'])
    await cliquer(w, 'Réessayer')
    expect(w.emitted('evenement')).toEqual([[{ type: 'rejouer' }]])
  })

  it('réaction après un bon choix : on avance, « Rejouer ce lieu » et « Continuer »', async () => {
    const w = monterLieu({ phase: 'consequence', resultat: resultat() })
    expect(w.text()).toContain('Tu avances !')
    await cliquer(w, 'Rejouer ce lieu')
    await cliquer(w, 'Continuer')
    expect(w.emitted('evenement')).toEqual([[{ type: 'rejouer' }], [{ type: 'continuer' }]])
  })

  it('après un essai, le choix risqué est barré et désactivé', () => {
    const w = monterLieu({ resultat: resultat({ choixId: null, qualite: null, essais: ['donne'] }) })
    const b = w.find('[data-choix="donne"]')
    expect(b.attributes('disabled')).toBeDefined()
    expect(b.text()).toContain('(déjà essayé)')
    expect(w.find('.rester').text()).toBe('Tu restes sur ta plateforme : essaie un autre choix.')
  })

  it('récupération : affiche le geste à pratiquer', () => {
    const w = monterLieu({ phase: 'recuperation' })
    expect(w.find('h2').text()).toBe('Maintenant, limite les dégâts')
    expect(w.find('.recuperation').exists()).toBe(true)
  })

  it('thème sensible : bouton « Passer ce lieu »', async () => {
    const w = monterLieu({ sensible: true })
    await cliquer(w, 'Passer ce lieu')
    expect(w.emitted('evenement')).toEqual([[{ type: 'passer' }]])
  })

  it('donne le focus au lieu à son arrivée, puis au titre à chaque phase', async () => {
    const w = mount(LieuStep, {
      props: { lieu: lieu(), phase: 'situation', mode: 'solo', sensible: false, leviers: leviersFixture() },
      attachTo: document.body,
    })
    await vi.waitFor(() => expect(document.activeElement).toBe(w.find('article').element))
    await w.setProps({ phase: 'consequence', resultat: resultat() })
    await vi.waitFor(() => expect(document.activeElement).toBe(w.find('h2').element))
    w.unmount()
  })
})

describe('CheminIle', () => {
  it('indique en texte les lieux visités, le lieu actuel et ceux à venir', () => {
    const w = mount(CheminIle, { props: { mission: parcoursFixture(), index: 1 } })
    const haltes = w.findAll('li')
    expect(haltes).toHaveLength(4)
    expect(haltes[0]!.text()).toContain('déjà visité')
    expect(haltes[1]!.attributes('aria-current')).toBe('step')
    expect(haltes[1]!.text()).toContain('tu es ici')
    expect(haltes[2]!.text()).toContain('à venir')
    expect(w.find('h2').text()).toBe('Ton chemin sur l’île')
  })
})

describe('DecorScene', () => {
  it.each(DECORS)('dessine le décor « %s »', (decor) => {
    const w = mount(DecorScene, { props: { decor } })
    expect(w.find(`svg[data-decor="${decor}"]`).exists()).toBe(true)
    expect(w.findAll('svg *').length).toBeGreaterThan(3)
  })
})

describe('un parcours dans les pages', () => {
  const monterPage = async (page: object, chemin: string) => {
    const router = await routerTest(chemin)
    return mount(page, { global: { plugins: [router] } })
  }

  it('se joue lieu après lieu jusqu’à la fin, avec le badge explorateur', async () => {
    const w = await monterPage(MissionPage, '/mission/p-parcours')
    expect(w.find('h1').text()).toBe('La traversée de l’île test')
    for (let i = 0; i < 4; i++) {
      expect(w.find('[aria-current="step"]').text()).toContain('La cour')
      expect(w.text()).toContain(`Étape ${i + 1} sur 4`)
      await w.find('[data-choix="aide"]').trigger('click')
      await cliquer(w, 'Continuer')
    }
    expect(w.text()).toContain('Mission terminée !')
    expect(w.text()).toContain('Explorateur·rice')
    expect(w.text()).toContain('Un mot de passe ne se prête pas.')
    expect(w.find('.chemin-ile').exists()).toBe(false)
    expect(store.etat.missions['p-parcours']).toMatchObject({
      badges: ['mission-accomplie', 'reflexe-verif', 'explorateur'],
      choix: { l1: 'aide', l2: 'aide', l3: 'aide', l4: 'aide' },
    })
  })

  it('la carte signale le format parcours', async () => {
    store.choisirTranche('6e')
    const w = await monterPage(CartePage, '/carte')
    expect(w.text()).toContain('La traversée de l’île test · Parcours · 15 min')
  })

  it('la fiche enseignant donne le format et les leviers des lieux', async () => {
    const w = await monterPage(FicheMissionPage, '/enseignants/p-parcours')
    expect(w.text()).toContain('Parcours de l’île en 4 lieux')
    expect(w.text()).toContain('Leviers travaillés')
  })

  it('le plan B imprime chaque lieu et son corrigé', async () => {
    const w = await monterPage(PlanBPage, '/enseignants/p-parcours/plan-b')
    expect(w.text()).toContain('Lieu 1 : La cour')
    expect(w.text()).toContain('☐ Je garde mon mot de passe')
    expect(w.text()).toContain('Si tu as choisi le piège, pourquoi ?')
    expect(w.text()).toContain('Bons choix : Je garde mon mot de passe / Je demande de l’aide à un adulte')
  })
})
