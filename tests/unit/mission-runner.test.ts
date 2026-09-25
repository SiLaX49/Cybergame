import { describe, expect, it } from 'vitest'
import {
  choixDuRun,
  demarrer,
  etapeCourante,
  reduire,
  resultatSurprise,
  RunError,
  type RunEvent,
  type RunState,
} from '@/engine/mission-runner'
import type { Mission } from '@/content/schema'
import { missionFixture, rappelFixture } from './fixtures'

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
      recuperationFaite: null,
      passe: false,
    })
    const suite = reduire(m, etat, { type: 'continuer' })
    expect(suite).toMatchObject({ index: 1, phase: null, choixId: null })
    expect(etapeCourante(m, suite)?.type).toBe('minijeu')
  })

  it('impose la récupération après un choix risqué qui la prévoit', () => {
    const etat = jouer(
      m,
      { type: 'choisir', choixId: 'clic' },
      { type: 'valider-indices', indices: [] },
      { type: 'continuer' },
    )
    expect(etat.phase).toBe('recuperation')
    expect(etat.resultats['sc-1']).toMatchObject({ recuperationFaite: false })
    const suite = reduire(m, etat, { type: 'recuperation-faite' })
    expect(suite.index).toBe(1)
    expect(suite.resultats['sc-1']).toMatchObject({ recuperationFaite: true })
  })

  it('ignore les indices inconnus', () => {
    const etat = jouer(m, { type: 'choisir', choixId: 'aide' }, { type: 'valider-indices', indices: ['url', 'zzz'] })
    expect(etat.resultats['sc-1']).toMatchObject({ indicesChoisis: ['url'], indicesJustes: 1, indicesFaux: 0 })
  })

  it('permet de rejouer un scénario depuis la conséquence', () => {
    const etat = jouer(
      m,
      { type: 'choisir', choixId: 'clic' },
      { type: 'valider-indices', indices: [] },
      { type: 'rejouer' },
    )
    expect(etat).toMatchObject({ index: 0, phase: 'situation', choixId: null, resultats: {} })
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
