import { describe, expect, it } from 'vitest'
import {
  choixDuRun,
  demarrer,
  etapeCourante,
  leviersDeLaMission,
  leviersDuRun,
  reduire,
  resultatSurprise,
  RunError,
  type RunEvent,
  type RunState,
} from '@/engine/mission-runner'
import type { Mission, Scenario } from '@/content/schema'
import { missionFixture, rappelFixture, rawScenario, rawTri } from './fixtures'

const jouer = (m: Mission, ...evenements: RunEvent[]): RunState =>
  evenements.reduce((etat, ev) => reduire(m, etat, ev), demarrer(m))

describe('mission-runner', () => {
  const m = missionFixture()

  it('démarre sur la situation du premier scénario', () => {
    const etat = demarrer(m)
    expect(etat).toMatchObject({ index: 0, phase: 'situation', termine: false })
    expect(etapeCourante(m, etat)?.id).toBe('sc-1')
  })

  it('enchaîne choix → indices → conséquence → étape suivante', () => {
    const etat = jouer(
      m,
      { type: 'choisir', choixId: 'verif' },
      { type: 'valider-indices', indices: ['url', 'montant'] },
    )
    expect(etat.phase).toBe('consequence')
    expect(etat.resultats['sc-1']).toEqual({
      type: 'scenario',
      choixId: 'verif',
      qualite: 'bon',
      indicesChoisis: ['url', 'montant'],
      indicesJustes: 1,
      indicesFaux: 1,
      levier: null,
      recuperationFaite: null,
      passe: false,
    })
    const suite = reduire(m, etat, { type: 'continuer' })
    expect(suite).toMatchObject({ index: 1, phase: null, choixId: null })
    expect(etapeCourante(m, suite)?.type).toBe('minijeu')
  })

  it('après un choix risqué, demande pourquoi puis impose la récupération', () => {
    const apresChoix = jouer(m, { type: 'choisir', choixId: 'clic' })
    expect(apresChoix.phase).toBe('pourquoi')
    const etat = reduire(m, apresChoix, { type: 'expliquer', levier: 'urgence' })
    expect(etat.phase).toBe('consequence')
    expect(etat.resultats['sc-1']).toMatchObject({ qualite: 'risque', levier: 'urgence', indicesChoisis: [], indicesJustes: 0 })
    const recup = reduire(m, etat, { type: 'continuer' })
    expect(recup.phase).toBe('recuperation')
    expect(recup.resultats['sc-1']).toMatchObject({ recuperationFaite: false })
    const suite = reduire(m, recup, { type: 'recuperation-faite' })
    expect(suite.index).toBe(1)
    expect(suite.resultats['sc-1']).toMatchObject({ recuperationFaite: true, levier: 'urgence' })
  })

  it('accepte « autre » et refuse un levier absent du scénario', () => {
    const apresChoix = jouer(m, { type: 'choisir', choixId: 'clic' })
    expect(reduire(m, apresChoix, { type: 'expliquer', levier: 'autre' }).resultats['sc-1']).toMatchObject({ levier: 'autre' })
    expect(() => reduire(m, apresChoix, { type: 'expliquer', levier: 'groupe' })).toThrow('levier inconnu : groupe')
  })

  it('refuse les événements hors phase autour de « pourquoi »', () => {
    const apresChoix = jouer(m, { type: 'choisir', choixId: 'clic' })
    expect(() => reduire(m, apresChoix, { type: 'valider-indices', indices: [] })).toThrow(RunError)
    const indices = jouer(m, { type: 'choisir', choixId: 'verif' })
    expect(() => reduire(m, indices, { type: 'expliquer', levier: 'urgence' })).toThrow(RunError)
  })

  it('sans bloc pourquoi, un choix risqué passe par les indices', () => {
    const sc = { ...(m.etapes[0] as Scenario) }
    delete sc.pourquoi
    const sansPourquoi = { ...m, etapes: [sc, ...m.etapes.slice(1)] }
    expect(jouer(sansPourquoi, { type: 'choisir', choixId: 'clic' }).phase).toBe('indices')
  })

  it('permet de passer un scénario pendant « pourquoi »', () => {
    const etat = jouer(m, { type: 'choisir', choixId: 'clic' }, { type: 'passer' })
    expect(etat.index).toBe(1)
    expect(etat.resultats['sc-1']).toMatchObject({ passe: true, levier: null })
  })

  it('ignore les indices inconnus', () => {
    const etat = jouer(m, { type: 'choisir', choixId: 'aide' }, { type: 'valider-indices', indices: ['url', 'zzz'] })
    expect(etat.resultats['sc-1']).toMatchObject({ indicesChoisis: ['url'], indicesJustes: 1, indicesFaux: 0 })
  })

  it('rejouer après le chemin risqué revient à la situation, puis un bon choix mène aux indices', () => {
    const etat = jouer(
      m,
      { type: 'choisir', choixId: 'clic' },
      { type: 'expliquer', levier: 'reflexe' },
      { type: 'rejouer' },
    )
    expect(etat).toMatchObject({ index: 0, phase: 'situation', choixId: null, resultats: {} })
    expect(reduire(m, etat, { type: 'choisir', choixId: 'verif' }).phase).toBe('indices')
  })

  it('permet de passer un scénario', () => {
    const etat = jouer(m, { type: 'passer' })
    expect(etat.index).toBe(1)
    expect(etat.resultats['sc-1']).toMatchObject({ passe: true, choixId: null })
  })

  it('termine la mission après le mini-jeu', () => {
    const etat = jouer(m, { type: 'passer' }, { type: 'minijeu-termine', reussites: 3, erreurs: 1 })
    expect(etat.termine).toBe(true)
    expect(etat.resultats['mj-1']).toEqual({ type: 'minijeu', reussites: 3, erreurs: 1 })
    expect(etapeCourante(m, etat)).toBeNull()
    expect(() => reduire(m, etat, { type: 'continuer' })).toThrow(RunError)
  })

  it('refuse un événement impossible dans la phase courante', () => {
    const etat = jouer(m, { type: 'choisir', choixId: 'verif' })
    expect(() => reduire(m, etat, { type: 'choisir', choixId: 'aide' })).toThrow(RunError)
    expect(() => reduire(m, demarrer(m), { type: 'minijeu-termine', reussites: 0, erreurs: 0 })).toThrow(RunError)
    expect(() => reduire(m, demarrer(m), { type: 'choisir', choixId: 'inconnu' })).toThrow(RunError)
  })

  it('résume les choix du run', () => {
    const etat = jouer(m, { type: 'choisir', choixId: 'verif' }, { type: 'valider-indices', indices: [] })
    expect(choixDuRun(etat)).toEqual({ 'sc-1': 'verif' })
  })

  it('liste les leviers du run et ceux de la mission', () => {
    const etat = jouer(m, { type: 'choisir', choixId: 'clic' }, { type: 'expliquer', levier: 'urgence' })
    expect(leviersDuRun(m, etat)).toEqual(['urgence'])
    expect(leviersDuRun(m, jouer(m, { type: 'choisir', choixId: 'aide' }, { type: 'valider-indices', indices: [] }))).toEqual([])
    expect(leviersDeLaMission(m)).toEqual(['urgence', 'petit-montant', 'reflexe'])
  })

  it('garde le levier dans le récapitulatif même après « rejouer »', () => {
    const etat = jouer(
      m,
      { type: 'choisir', choixId: 'clic' },
      { type: 'expliquer', levier: 'urgence' },
      { type: 'rejouer' },
      { type: 'choisir', choixId: 'verif' },
      { type: 'valider-indices', indices: ['url'] },
      { type: 'continuer' },
      { type: 'minijeu-termine', reussites: 3, erreurs: 0 },
    )
    expect(etat.termine).toBe(true)
    expect(etat.resultats['sc-1']).toMatchObject({ qualite: 'bon', levier: null })
    expect(leviersDuRun(m, etat)).toEqual(['urgence'])
  })

  it('liste les leviers cédés dans l’ordre, sans doublon, sur plusieurs scénarios', () => {
    const deux = missionFixture({
      etapes: [rawScenario('sc-1'), rawScenario('sc-2'), { type: 'minijeu', id: 'mj-1', jeu: 'tri', config: rawTri() }],
    })
    const etat = jouer(
      deux,
      { type: 'choisir', choixId: 'clic' },
      { type: 'expliquer', levier: 'reflexe' },
      { type: 'rejouer' },
      { type: 'choisir', choixId: 'clic' },
      { type: 'expliquer', levier: 'urgence' },
      { type: 'continuer' },
      { type: 'recuperation-faite' },
      { type: 'choisir', choixId: 'clic' },
      { type: 'expliquer', levier: 'reflexe' },
      { type: 'passer' },
      { type: 'minijeu-termine', reussites: 3, erreurs: 0 },
    )
    expect(etat.leviersCedes).toEqual(['reflexe', 'urgence'])
    expect(leviersDuRun(deux, etat)).toEqual(['reflexe', 'urgence'])
  })

  it('démarre sans levier cédé', () => {
    expect(demarrer(m).leviersCedes).toEqual([])
  })

  describe('fil de notifications', () => {
    const r = rappelFixture()

    it('exige une action pour chaque notification', () => {
      expect(() => reduire(r, demarrer(r), { type: 'fil-termine', actions: { n1: 'ignorer' } })).toThrow(
        'notifications sans action : n2, n3',
      )
    })

    it.each([
      ['ouvrir', 'piege'],
      ['verifier', 'verifie'],
      ['signaler', 'signale'],
      ['ignorer', 'ignore'],
    ] as const)('traduit l’action « %s » sur la surprise en « %s »', (action, attendu) => {
      const etat = reduire(r, demarrer(r), {
        type: 'fil-termine',
        actions: { n1: 'ouvrir', n2: action, n3: 'ignorer' },
      })
      expect(etat.termine).toBe(true)
      expect(resultatSurprise(etat)).toBe(attendu)
    })
  })
})
