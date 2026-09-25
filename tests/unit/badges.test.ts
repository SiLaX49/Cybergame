import { describe, expect, it } from 'vitest'
import { calculerBadges } from '@/engine/badges'
import { demarrer, reduire, type RunEvent } from '@/engine/mission-runner'
import type { Mission } from '@/content/schema'
import { missionFixture, rappelFixture } from './fixtures'

const jouer = (m: Mission, ...evs: RunEvent[]) => evs.reduce((e, ev) => reduire(m, e, ev), demarrer(m))
const finTri: RunEvent = { type: 'minijeu-termine', reussites: 4, erreurs: 0 }

describe('calculerBadges', () => {
  const m = missionFixture()

  it('ne donne rien tant que la mission n’est pas terminée', () => {
    expect(calculerBadges(demarrer(m))).toEqual([])
  })

  it('récompense le bon processus : indices justes et choix prudent', () => {
    const etat = jouer(
      m,
      { type: 'choisir', choixId: 'verif' },
      { type: 'valider-indices', indices: ['url', 'urgence'] },
      { type: 'continuer' },
      finTri,
    )
    expect(calculerBadges(etat)).toEqual(['mission-accomplie', 'oeil-de-lynx', 'reflexe-verif'])
  })

  it('récompense la réparation après un choix risqué', () => {
    const etat = jouer(
      m,
      { type: 'choisir', choixId: 'clic' },
      { type: 'valider-indices', indices: ['montant'] },
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
