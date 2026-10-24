import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { demarrer, reduire, type RunEvent, type RunState } from '@/engine/mission-runner'
import CheminIle from '@/mission/CheminIle.vue'
import FinMission from '@/mission/FinMission.vue'
import MissionPage from '@/pages/MissionPage.vue'
import { creerStore, definirStore } from '@/store/useProgress'
import { fourcheFixture, leviersFixture, nomLieuFourche as nomDe, parcoursFixture } from './fixtures'
import { cliquer } from './helpers'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

vi.mock('@/content', async () => {
  const { creerAcces } = await import('@/content/acces')
  const f = await import('./fixtures')
  return creerAcces({
    generatedAt: '2026-10-05T10:00:00.000Z',
    themes: f.themesFixture(),
    leviers: f.leviersFixture(),
    missions: [f.fourcheFixture({ theme: 'jeux-achats' })],
  })
})

beforeEach(() => {
  definirStore(creerStore(new MemoryStorage()))
})

const mission = fourcheFixture()
const jouer = (...evenements: RunEvent[]): RunState => evenements.reduce((e, ev) => reduire(mission, e, ev), demarrer(mission))
const bien: RunEvent[] = [{ type: 'choisir', choixId: 'garde' }, { type: 'continuer' }]
const aide: RunEvent[] = [{ type: 'choisir', choixId: 'aide' }, { type: 'continuer' }]

describe('CheminIle sur un parcours à deux routes', () => {
  it('avant la bifurcation : lieux à venir « selon ton choix », sans nom', () => {
    const w = mount(CheminIle, { props: { mission, chemin: ['l1'], courante: 'l2' } })
    const items = w.findAll('li.halte').map((li) => li.text())
    expect(items).toHaveLength(5)
    expect(items[2]).toContain('selon ton choix')
    expect(items[3]).toContain('selon ton choix')
    expect(w.text()).not.toContain(nomDe('a3'))
    expect(w.text()).not.toContain(nomDe('b3'))
    expect(items[4]).toContain(nomDe('l5'))
  })
  it('après la bifurcation : seule la route prise, avec ses noms', () => {
    const w = mount(CheminIle, { props: { mission, chemin: ['l1', 'l2'], courante: 'b3' } })
    expect(w.text()).toContain(nomDe('b3'))
    expect(w.text()).toContain(nomDe('b4'))
    expect(w.text()).not.toContain(nomDe('a3'))
    expect(w.find('[aria-current="step"]').text()).toContain(nomDe('b3'))
  })
  it('un parcours linéaire affiche tous ses lieux comme avant', () => {
    const lineaire = parcoursFixture()
    const w = mount(CheminIle, { props: { mission: lineaire, chemin: ['l1'], courante: 'l2' } })
    const haltes = w.findAll('li.halte')
    expect(haltes).toHaveLength(4)
    expect(haltes[0]!.text()).toContain('déjà visité')
    expect(haltes[1]!.text()).toContain('tu es ici')
    expect(haltes[2]!.text()).toContain('à venir')
    expect(w.text()).not.toContain('selon ton choix')
  })
})

describe('MissionPage sur un parcours à deux routes', () => {
  it('compteur « Étape n sur 5 » sur un parcours à 7 lieux, scène sans nom caché', async () => {
    const store = creerStore(new MemoryStorage())
    store.choisirPersonnage('p1')
    definirStore(store)
    const w = mount(MissionPage, { global: { plugins: [await routerTest('/mission/p-fourche')] } })
    expect(w.text()).toContain('Étape 1 sur 5')
    expect(w.find('.position').text()).toContain('Étape 1 sur 5')
    await w.find('[data-choix="garde"]').trigger('click')
    await cliquer(w, 'Continuer')
    expect(w.text()).toContain('Étape 2 sur 5')
    expect(w.find('.position').text()).toContain('Étape 2 sur 5')
    expect(w.find('[aria-current="step"]').text()).toContain(nomDe('l2'))
    expect(w.text()).not.toContain(nomDe('a3'))
    expect(w.text()).not.toContain(nomDe('b3'))
    expect(w.text()).toContain('selon ton choix')
  })
})

describe('FinMission avec deux routes', () => {
  const monter = async (etat: RunState, m = mission) =>
    mount(FinMission, { props: { mission: m, etat, leviers: leviersFixture() }, global: { plugins: [await routerTest()] } })

  it('« Tu as pris la route … » et « Rejouer pour découvrir l’autre route »', async () => {
    const etat = jouer(...bien, ...aide, ...bien, ...bien, ...bien)
    expect(etat.termine).toBe(true)
    expect(etat.chemin).toEqual(['l1', 'l2', 'b3', 'b4', 'l5'])
    const w = await monter(etat)
    expect(w.find('.encadre-info').text()).toContain('Tu as pris la route « je demande à un adulte ». Il existe')
    expect(w.text()).toContain('Il existe une autre bonne route.')
    await cliquer(w, 'Rejouer pour découvrir l’autre route')
    expect(w.emitted('rejouer')).toHaveLength(1)
  })
  it('route « bon » : le texte du choix fait', async () => {
    const w = await monter(jouer(...bien, ...bien, ...bien, ...bien, ...bien))
    expect(w.text()).toContain('Tu as pris la route « je garde mon mot de passe ». Il existe')
  })
  it('fin d’un parcours linéaire : aucune mention de route', async () => {
    const lineaire = parcoursFixture()
    const etat = ['l1', 'l2', 'l3', 'l4'].reduce((e) => bien.reduce((x, ev) => reduire(lineaire, x, ev), e), demarrer(lineaire))
    expect(etat.termine).toBe(true)
    const w = await monter(etat, lineaire)
    expect(w.text()).not.toContain('route')
    expect(w.text()).not.toContain('Rejouer pour découvrir')
  })
})

describe('FinMission : seuls les lieux joués comptent', () => {
  const pourquoi = (...leviers: string[]) => leviers.map((levier) => ({ levier, truc: 'Un truc.', parade: 'Une parade.' }))
  const base = fourcheFixture({ theme: 'jeux-achats' })
  const m = fourcheFixture({
    theme: 'jeux-achats',
    etapes: (base.etapes as unknown as Record<string, unknown>[]).map((e) =>
      e.id === 'a3' ? { ...e, pourquoi: pourquoi('groupe', 'humour', 'secret') } : e.id === 'b3' ? { ...e, pourquoi: pourquoi('colere', 'honte', 'flatterie') } : e,
    ),
  })
  const leviers = leviersFixture()
  const libelle = (id: 'groupe' | 'colere') => leviers.leviers[id].libelle
  const parcourir = (...evenements: RunEvent[]) => evenements.reduce((e, ev) => reduire(m, e, ev), demarrer(m))
  const monter = async (etat: RunState) =>
    mount(FinMission, { props: { mission: m, etat, leviers }, global: { plugins: [await routerTest()] } })

  it('leviersDeLaMission(mission, chemin) : tronc et route jouée seulement', async () => {
    const { leviersDeLaMission } = await import('@/engine/mission-runner')
    expect(leviersDeLaMission(m)).toContain('groupe')
    expect(leviersDeLaMission(m)).toContain('colere')
    expect(leviersDeLaMission(m, ['l1', 'l2', 'a3', 'a4', 'l5'])).toEqual(['confiance', 'gain', 'urgence', 'groupe', 'humour', 'secret'])
    expect(leviersDeLaMission(m, ['l1', 'l2', 'b3', 'b4', 'l5'])).toEqual(['confiance', 'gain', 'urgence', 'colere', 'honte', 'flatterie'])
  })
  it('« À surveiller » : aucun levier de la route non prise', async () => {
    const etat = parcourir(...bien, ...bien, ...bien, ...bien, ...bien)
    expect(etat.chemin).toEqual(['l1', 'l2', 'a3', 'a4', 'l5'])
    const w = await monter(etat)
    expect(w.text()).toContain('Aucun piège n’a marché sur toi')
    expect(w.find('.craquer').text()).toContain(libelle('groupe'))
    expect(w.find('.craquer').text()).not.toContain(libelle('colere'))
  })
  it('tous les lieux joués passés : pas de « Aucun piège n’a marché sur toi »', async () => {
    const passer: RunEvent = { type: 'passer' }
    const etat = parcourir(passer, passer, passer, passer, passer)
    expect(etat.termine).toBe(true)
    const w = await monter(etat)
    expect(w.text()).not.toContain('Aucun piège n’a marché sur toi')
    expect(w.find('.craquer').exists()).toBe(false)
  })
  it('bifurcation passée : la ligne de route donne la route « bon » et l’offre de rejouer', async () => {
    const passer: RunEvent = { type: 'passer' }
    const w = await monter(parcourir(passer, passer, passer, passer, passer))
    expect(w.find('.route-prise h3').text()).toBe('Ta route')
    expect(w.find('.route-prise').text()).toContain('Tu as pris la route « je garde mon mot de passe ».')
    expect(w.text()).toContain('Rejouer pour découvrir l’autre route')
  })
})
