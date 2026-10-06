import { describe, expect, it } from 'vitest'
import { calculerBadges } from '@/engine/badges'
import {
  choixDuRun,
  demarrer,
  etapeCourante,
  leviersDeLaMission,
  reduire,
  RunError,
  type RunEvent,
  type RunState,
} from '@/engine/mission-runner'
import { lieuSchema, missionSchema, type Mission } from '@/content/schema'
import { parcoursFixture, rawLieu, rawMission, rawParcours, rawRappel, rawScenario, rawTri } from './fixtures'

const jouer = (m: Mission, ...evenements: RunEvent[]): RunState =>
  evenements.reduce((etat, ev) => reduire(m, etat, ev), demarrer(m))
const messages = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.success ? [] : (r.error?.issues.map((i) => i.message) ?? [])

describe('schéma : étape lieu', () => {
  it('accepte un lieu complet', () => {
    expect(lieuSchema.safeParse(rawLieu()).success).toBe(true)
  })

  it('exige un choix « aide »', () => {
    const l = rawLieu()
    l.choix = l.choix.filter((c) => c.qualite !== 'aide')
    expect(messages(lieuSchema.safeParse(l))).toContain('il faut un choix de qualité "aide" (Je demande de l’aide…)')
  })

  it('exige un bloc pourquoi quand un choix est risqué, et le refuse sinon', () => {
    const sansPourquoi = { ...rawLieu(), pourquoi: undefined }
    expect(messages(lieuSchema.safeParse(sansPourquoi)).join()).toContain('il faut un bloc pourquoi')
    const l = rawLieu()
    const sansRisque = { ...l, recuperation: undefined, choix: l.choix.filter((c) => c.qualite !== 'risque') }
    expect(messages(lieuSchema.safeParse(sansRisque))).toContain('le bloc pourquoi suppose un choix de qualité "risque"')
  })

  it('refuse une récupération après le choix « aide » ou un décor inconnu', () => {
    expect(messages(lieuSchema.safeParse({ ...rawLieu(), recuperation: { action: 'changer-mdp', siChoix: ['aide'] } }))).toContain(
      'la récupération ne peut pas suivre le choix "aide"',
    )
    expect(lieuSchema.safeParse({ ...rawLieu(), decor: 'plage-inconnue' }).success).toBe(false)
  })
})

describe('schéma : format parcours', () => {
  it('accepte un parcours de 4 lieux, au format classique par défaut sinon', () => {
    expect(parcoursFixture().format).toBe('parcours')
    expect(missionSchema.parse(rawMission()).format).toBe('classique')
  })

  it('refuse un lieu dans une mission classique', () => {
    const m = rawMission({ etapes: [rawScenario('sc-1'), rawLieu('l1')] })
    expect(messages(missionSchema.safeParse(m))).toContain('une étape « lieu » n’existe que dans une mission au format parcours')
  })

  it('refuse un scénario dans un parcours', () => {
    const m = rawParcours({ etapes: [rawLieu('l1'), rawLieu('l2'), rawLieu('l3'), rawLieu('l4'), rawScenario('sc-1')] })
    expect(messages(missionSchema.safeParse(m))).toContain('un parcours ne contient que des lieux et au plus un mini-jeu')
  })

  it('exige 4 à 6 lieux et au plus un mini-jeu', () => {
    const court = rawParcours({ etapes: [rawLieu('l1'), rawLieu('l2'), rawLieu('l3')] })
    expect(messages(missionSchema.safeParse(court))).toContain('un parcours compte 4 à 6 lieux (trouvé : 3)')
    const long = rawParcours({ etapes: ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(rawLieu) })
    expect(messages(missionSchema.safeParse(long))).toContain('un parcours compte 4 à 6 lieux (trouvé : 7)')
    const jeux = rawParcours({
      etapes: [
        ...['a', 'b', 'c', 'd'].map(rawLieu),
        { type: 'minijeu', id: 'mj-1', jeu: 'tri', config: rawTri() },
        { type: 'minijeu', id: 'mj-2', jeu: 'tri', config: rawTri() },
      ],
    })
    expect(messages(missionSchema.safeParse(jeux))).toContain('un parcours contient au plus un mini-jeu')
  })

  it('refuse un rappel au format parcours', () => {
    expect(messages(missionSchema.safeParse(rawRappel({ format: 'parcours' })))).toContain(
      'une mission rappel ne peut pas être un parcours',
    )
  })
})

describe('moteur : lieux d’un parcours', () => {
  const m = parcoursFixture()
  const avancer = (n: number): RunEvent[] =>
    Array.from({ length: n }, (): RunEvent[] => [{ type: 'choisir', choixId: 'garde' }, { type: 'continuer' }]).flat()

  it('démarre sur la situation du premier lieu', () => {
    const etat = demarrer(m)
    expect(etat).toMatchObject({ index: 0, phase: 'situation' })
    expect(etapeCourante(m, etat)?.type).toBe('lieu')
  })

  it('un bon choix mène directement à la réaction, sans étape indices', () => {
    const etat = jouer(m, { type: 'choisir', choixId: 'garde' })
    expect(etat.phase).toBe('consequence')
    expect(etat.resultats.l1).toEqual({
      type: 'lieu',
      choixId: 'garde',
      qualite: 'bon',
      levier: null,
      recuperationFaite: null,
      essais: [],
      passe: false,
    })
    expect(() => reduire(m, etat, { type: 'valider-indices', indices: [] })).toThrow(RunError)
  })

  it('un choix risqué : pourquoi, réaction, récupération, puis retour au même lieu', () => {
    let etat = jouer(m, { type: 'choisir', choixId: 'donne' })
    expect(etat.phase).toBe('pourquoi')
    etat = reduire(m, etat, { type: 'expliquer', levier: 'confiance' })
    expect(etat.phase).toBe('consequence')
    expect(etat.resultats.l1).toMatchObject({ type: 'lieu', qualite: 'risque', levier: 'confiance', essais: ['donne'] })
    expect(etat.leviersCedes).toEqual(['confiance'])
    etat = reduire(m, etat, { type: 'continuer' })
    expect(etat.phase).toBe('recuperation')
    etat = reduire(m, etat, { type: 'recuperation-faite' })
    expect(etat).toMatchObject({ index: 0, phase: 'situation', choixId: null })
    expect(etat.resultats.l1).toMatchObject({ recuperationFaite: true, essais: ['donne'] })
    expect(() => reduire(m, etat, { type: 'choisir', choixId: 'donne' })).toThrow(RunError)
    etat = reduire(m, reduire(m, etat, { type: 'choisir', choixId: 'garde' }), { type: 'continuer' })
    expect(etat).toMatchObject({ index: 1, phase: 'situation' })
    expect(etat.resultats.l1).toMatchObject({ choixId: 'garde', qualite: 'bon', levier: null, essais: ['donne'] })
  })

  it('un choix risqué sans récupération : « Continuer » refusé, « Réessayer » ramène au même lieu', () => {
    let etat = jouer(m, ...avancer(1), { type: 'choisir', choixId: 'donne' }, { type: 'expliquer', levier: 'gain' })
    expect(etat.index).toBe(1)
    expect(() => reduire(m, etat, { type: 'continuer' })).toThrow(RunError)
    etat = reduire(m, etat, { type: 'rejouer' })
    expect(etat).toMatchObject({ index: 1, phase: 'situation', choixId: null })
    expect(etat.resultats.l2).toMatchObject({ essais: ['donne'] })
  })

  it('double clic : un second choix est refusé', () => {
    const etat = jouer(m, { type: 'choisir', choixId: 'garde' })
    expect(() => reduire(m, etat, { type: 'choisir', choixId: 'aide' })).toThrow(RunError)
  })

  it('refuse un levier absent du lieu', () => {
    const etat = jouer(m, { type: 'choisir', choixId: 'donne' })
    expect(() => reduire(m, etat, { type: 'expliquer', levier: 'autorite' })).toThrow(RunError)
  })

  it('rejouer après un bon choix vide le résultat mais garde les essais', () => {
    const etat = jouer(
      m,
      { type: 'choisir', choixId: 'donne' }, { type: 'expliquer', levier: 'gain' }, { type: 'continuer' }, { type: 'recuperation-faite' },
      { type: 'choisir', choixId: 'garde' }, { type: 'rejouer' },
    )
    expect(etat.phase).toBe('situation')
    expect(etat.resultats.l1).toMatchObject({ choixId: null, qualite: null, essais: ['donne'] })
  })

  it('passer un lieu le marque passé', () => {
    const etat = jouer(m, { type: 'passer' })
    expect(etat.index).toBe(1)
    expect(etat.resultats.l1).toMatchObject({ type: 'lieu', passe: true, choixId: null })
  })

  it('choixDuRun et leviersDeLaMission tiennent compte des lieux', () => {
    const etat = jouer(m, { type: 'choisir', choixId: 'garde' })
    expect(choixDuRun(etat)).toEqual({ l1: 'garde' })
    expect(leviersDeLaMission(m)).toEqual(['confiance', 'gain', 'urgence'])
  })
})

describe('badges d’un parcours', () => {
  const m = parcoursFixture()
  const prudent = (n: number): RunEvent[] =>
    Array.from({ length: n }, (): RunEvent[] => [{ type: 'choisir', choixId: 'garde' }, { type: 'continuer' }]).flat()

  it('toute l’île traversée avec prudence', () => {
    expect(calculerBadges(jouer(m, ...prudent(4)))).toEqual(['mission-accomplie', 'reflexe-verif', 'explorateur'])
  })

  it('réparer après un choix risqué, puis trouver le bon choix', () => {
    const etat = jouer(
      m,
      { type: 'choisir', choixId: 'donne' }, { type: 'expliquer', levier: 'gain' }, { type: 'continuer' }, { type: 'recuperation-faite' },
      { type: 'choisir', choixId: 'garde' }, { type: 'continuer' },
      ...prudent(3),
    )
    expect(calculerBadges(etat)).toEqual(['mission-accomplie', 'reparateur', 'explorateur'])
  })

  it('pas d’explorateur si un lieu a été passé', () => {
    expect(calculerBadges(jouer(m, { type: 'passer' }, ...prudent(3)))).not.toContain('explorateur')
  })
})
