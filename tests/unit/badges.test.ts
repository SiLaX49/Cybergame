import { describe, expect, it } from 'vitest'
import { calculerBadges } from '@/engine/badges'
import { demarrer, reduire, type RunEvent } from '@/engine/mission-runner'
import type { Mission, Scenario } from '@/content/schema'
import { missionFixture, rappelFixture, rawScenario, rawTri } from './fixtures'

const jouer = (m: Mission, ...evs: RunEvent[]) => evs.reduce((e, ev) => reduire(m, e, ev), demarrer(m))
const finTri: RunEvent = { type: 'minijeu-termine', reussites: 4, erreurs: 0 }

describe('calculerBadges', () => {
  const m = missionFixture()

  it('ne donne rien tant que la mission n’est pas terminée', () => {
    expect(calculerBadges(demarrer(m))).toEqual([])
  })

  it('récompense le bon processus : choix prudent sans demander d’indice', () => {
    const etat = jouer(m, { type: 'choisir', choixId: 'verif' }, { type: 'continuer' }, finTri)
    expect(calculerBadges(etat)).toEqual(['mission-accomplie', 'oeil-de-lynx', 'reflexe-verif'])
  })

  it('« Œil de lynx » se perd si l’indice a été demandé', () => {
    const etat = jouer(m, { type: 'indice' }, { type: 'choisir', choixId: 'verif' }, { type: 'continuer' }, finTri)
    expect(calculerBadges(etat)).toEqual(['mission-accomplie', 'reflexe-verif'])
  })

  it('récompense la réparation après un choix risqué', () => {
    const etat = jouer(
      m,
      { type: 'choisir', choixId: 'clic' },
      { type: 'expliquer', levier: 'urgence' },
      { type: 'continuer' },
      { type: 'recuperation-faite' },
      finTri,
    )
    expect(calculerBadges(etat)).toEqual(['mission-accomplie', 'reparateur'])
  })

  it('« Œil de lynx » se perd dès qu’un scénario joué tombe dans le piège', () => {
    const deux = missionFixture({
      etapes: [rawScenario('sc-1'), rawScenario('sc-2'), { type: 'minijeu', id: 'mj-1', jeu: 'tri', config: rawTri() }],
    })
    const etat = jouer(
      deux,
      { type: 'choisir', choixId: 'verif' },
      { type: 'continuer' },
      { type: 'choisir', choixId: 'clic' },
      { type: 'expliquer', levier: 'urgence' },
      { type: 'continuer' },
      { type: 'recuperation-faite' },
      finTri,
    )
    expect(calculerBadges(etat)).toEqual(['mission-accomplie', 'reparateur'])
  })

  it('« Œil de lynx » ignore les scénarios passés', () => {
    const deux = missionFixture({
      etapes: [rawScenario('sc-1'), rawScenario('sc-2'), { type: 'minijeu', id: 'mj-1', jeu: 'tri', config: rawTri() }],
    })
    const etat = jouer(deux, { type: 'indice' }, { type: 'passer' }, { type: 'choisir', choixId: 'aide' }, { type: 'continuer' }, finTri)
    expect(calculerBadges(etat)).toEqual(['mission-accomplie', 'oeil-de-lynx', 'reflexe-verif'])
  })

  it('« Œil de lynx » refuse un piège même sans bloc pourquoi', () => {
    const sc = { ...(m.etapes[0] as Scenario) }
    delete sc.pourquoi
    const sansPourquoi = { ...m, etapes: [sc, ...m.etapes.slice(1)] }
    const etat = jouer(
      sansPourquoi,
      { type: 'choisir', choixId: 'clic' },
      { type: 'continuer' },
      { type: 'recuperation-faite' },
      finTri,
    )
    expect(calculerBadges(etat)).toEqual(['mission-accomplie', 'reparateur'])
  })

  it('ne donne pas les badges de processus si tous les scénarios sont passés', () => {
    expect(calculerBadges(jouer(m, { type: 'passer' }, finTri))).toEqual(['mission-accomplie'])
  })

  it('donne « vigilant » si la surprise n’a pas piégé', () => {
    const r = rappelFixture()
    const ok = jouer(r, { type: 'fil-termine', actions: { n1: 'ignorer', n2: 'signaler', n3: 'ignorer' } })
    expect(calculerBadges(ok)).toEqual(['mission-accomplie', 'vigilant'])
    const piege = jouer(r, { type: 'fil-termine', actions: { n1: 'ignorer', n2: 'ouvrir', n3: 'ignorer' } })
    expect(calculerBadges(piege)).toEqual(['mission-accomplie'])
  })
})
