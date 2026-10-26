import { describe, expect, it } from 'vitest'
import type { Mission } from '@/content/schema'
import { demarrer, reduire, type RunEvent } from '@/engine/mission-runner'
import { aRepareUneErreur, GAINS, octetsDuRun } from '@/engine/octets'
import { dateDuJour, defiDuJour, objectifsDuJour, solde, totalGagne } from '@/engine/portefeuille'
import { creerStore } from '@/store/useProgress'
import { MemoryStorage } from './memory-storage'
import { missionFixture, parcoursFixture, troisRoutesFixture } from './fixtures'

const jouer = (m: Mission, ...evs: RunEvent[]) => evs.reduce((e, ev) => reduire(m, e, ev), demarrer(m))
const finTri: RunEvent = { type: 'minijeu-termine', reussites: 4, erreurs: 0 }
const lignes = (m: Mission, ...evs: RunEvent[]) => Object.fromEntries(octetsDuRun(m, jouer(m, ...evs)).lignes.map((l) => [l.libelle, l.octets]))

describe('octetsDuRun', () => {
  const m = missionFixture()

  it('ne rapporte rien tant que la mission n’est pas finie', () => {
    expect(octetsDuRun(m, demarrer(m)).total).toBe(0)
  })

  it('récompense le bon réflexe, la fin de mission et le mini-jeu', () => {
    const etat = jouer(m, { type: 'choisir', choixId: 'verif' }, { type: 'continuer' }, finTri)
    expect(octetsDuRun(m, etat)).toEqual({
      lignes: [
        { libelle: 'Mission terminée', octets: GAINS.missionTerminee },
        { libelle: 'Bon réflexe', octets: GAINS.bonReflexe },
        { libelle: 'Mini-jeu', octets: 8 },
      ],
      total: GAINS.missionTerminee + GAINS.bonReflexe + 8,
    })
  })

  it('demander de l’aide est un bon réflexe ; l’indice rapporte un peu moins', () => {
    expect(lignes(m, { type: 'choisir', choixId: 'aide' }, { type: 'continuer' }, finTri)['Bon réflexe']).toBe(GAINS.bonReflexe)
    expect(lignes(m, { type: 'indice' }, { type: 'choisir', choixId: 'verif' }, { type: 'continuer' }, finTri)['Bon réflexe avec un indice']).toBe(GAINS.avecIndice)
  })

  it('une erreur réparée rapporte presque autant qu’un bon réflexe ; non réparée, rien', () => {
    const repare = jouer(m, { type: 'choisir', choixId: 'clic' }, { type: 'expliquer', levier: 'urgence' }, { type: 'continuer' }, { type: 'recuperation-faite' }, finTri)
    expect(octetsDuRun(m, repare).lignes).toContainEqual({ libelle: 'Erreur réparée', octets: GAINS.erreurReparee })
    expect(aRepareUneErreur(m, repare)).toBe(true)
    expect(GAINS.erreurReparee).toBeGreaterThanOrEqual(GAINS.bonReflexe - 2)
  })

  it('une étape passée ne rapporte rien', () => {
    const etat = jouer(m, { type: 'passer' }, finTri)
    expect(octetsDuRun(m, etat).lignes.map((l) => l.libelle)).toEqual(['Mission terminée', 'Mini-jeu'])
  })

  it('le mini-jeu est plafonné', () => {
    const etat = jouer(m, { type: 'choisir', choixId: 'verif' }, { type: 'continuer' }, { type: 'minijeu-termine', reussites: 40, erreurs: 0 })
    expect(octetsDuRun(m, etat).lignes).toContainEqual({ libelle: 'Mini-jeu', octets: GAINS.plafondMinijeu })
  })

  it('parcours : retenter après un essai risqué rapporte « Retenté et trouvé »', () => {
    const p = parcoursFixture()
    const etat = jouer(
      p,
      { type: 'choisir', choixId: 'donne' }, { type: 'expliquer', levier: 'confiance' }, { type: 'rejouer' },
      { type: 'choisir', choixId: 'garde' }, { type: 'continuer' },
      { type: 'choisir', choixId: 'garde' }, { type: 'continuer' },
      { type: 'choisir', choixId: 'garde' }, { type: 'continuer' },
      { type: 'choisir', choixId: 'garde' }, { type: 'continuer' },
    )
    expect(etat.termine).toBe(true)
    expect(octetsDuRun(p, etat).lignes).toContainEqual({ libelle: 'Retenté et trouvé', octets: GAINS.retenteReussie })
  })

  it('trois routes : prendre la route de réparation est une erreur reconnue, récompensée', () => {
    const p = troisRoutesFixture()
    const bon: RunEvent[] = [{ type: 'choisir', choixId: 'garde' }, { type: 'continuer' }]
    const etat = jouer(
      p,
      ...bon,
      { type: 'choisir', choixId: 'donne' }, { type: 'expliquer', levier: 'confiance' }, { type: 'continuer' },
      ...bon, ...bon, ...bon,
    )
    expect(etat.termine).toBe(true)
    expect(etat.chemin).toContain('c3')
    expect(octetsDuRun(p, etat).lignes).toContainEqual({ libelle: 'Erreur reconnue, route de réparation', octets: GAINS.routeReparation })
    expect(aRepareUneErreur(p, etat)).toBe(true)
  })
})

describe('portefeuille', () => {
  it('date du jour en heure locale', () => {
    expect(dateDuJour(new Date(2026, 9, 5, 23, 30))).toBe('2026-10-05')
  })

  it('solde = gains + défis − achats', () => {
    const p = { octets: { a: 100, b: 50 }, defis: ['2026-10-01'], achats: ['titre-apprenti'] }
    expect(totalGagne(p)).toBe(150 + GAINS.defiDuJour)
    expect(solde(p)).toBe(150 + GAINS.defiDuJour - 50)
    expect(solde({ ...p, achats: ['objet-retire'] })).toBe(150 + GAINS.defiDuJour)
  })

  it('le défi du jour est stable pour une date, et jamais un rappel ni un thème sensible', () => {
    const missions = [
      { id: 'm1', type: 'mission' as const, theme: 'phishing' },
      { id: 'm2', type: 'mission' as const, theme: 'comptes' },
      { id: 'r1', type: 'rappel' as const, theme: undefined },
      { id: 's1', type: 'mission' as const, theme: 'harcelement' },
    ]
    const sensible = (t: string) => t === 'harcelement'
    const jours = Array.from({ length: 30 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)
    const tires = jours.map((d) => defiDuJour(missions, sensible, d))
    expect(new Set(tires)).toEqual(new Set(['m1', 'm2']))
    expect(defiDuJour(missions, sensible, '2026-10-07')).toBe(defiDuJour([...missions].reverse(), sensible, '2026-10-07'))
    expect(defiDuJour([], sensible, '2026-10-07')).toBeNull()
  })

  it('objectifs du jour : le journal d’un autre jour ne compte pas', () => {
    const journal = { date: '2026-10-05', missions: 2, octets: 120, reparations: 1 }
    expect(objectifsDuJour({ journal, defis: ['2026-10-05'] }, '2026-10-05').every((o) => o.fait)).toBe(true)
    expect(objectifsDuJour({ journal, defis: ['2026-10-05'] }, '2026-10-06').some((o) => o.fait)).toBe(false)
  })
})

describe('store : octets, défis et boutique', () => {
  const jour = new Date(2026, 9, 5, 10)

  it('ne crédite que l’amélioration du meilleur gain', () => {
    const store = creerStore(new MemoryStorage())
    expect(store.crediterMission('m', 60, false, jour)).toBe(60)
    expect(store.crediterMission('m', 40, false, jour)).toBe(0)
    expect(store.crediterMission('m', 75, true, jour)).toBe(15)
    expect(store.etat.octets).toEqual({ m: 75 })
    expect(store.etat.journal).toEqual({ date: '2026-10-05', missions: 3, octets: 75, reparations: 1 })
  })

  it('le journal repart de zéro le lendemain', () => {
    const store = creerStore(new MemoryStorage())
    store.crediterMission('m', 60, false, jour)
    store.crediterMission('n', 30, false, new Date(2026, 9, 6, 9))
    expect(store.etat.journal).toEqual({ date: '2026-10-06', missions: 1, octets: 30, reparations: 0 })
  })

  it('le défi du jour ne se relève qu’une fois par jour', () => {
    const store = creerStore(new MemoryStorage())
    expect(store.releverDefi(jour)).toBe(true)
    expect(store.releverDefi(jour)).toBe(false)
    expect(store.etat.defis).toEqual(['2026-10-05'])
    expect(solde(store.etat)).toBe(GAINS.defiDuJour)
  })

  it('achète seulement avec assez d’octets, une seule fois ; un titre acheté est porté', () => {
    const store = creerStore(new MemoryStorage())
    expect(store.acheter('titre-apprenti')).toBe(false)
    store.crediterMission('m', 60, false, jour)
    expect(store.acheter('inconnu')).toBe(false)
    expect(store.acheter('titre-apprenti')).toBe(true)
    expect(store.acheter('titre-apprenti')).toBe(false)
    expect(store.etat.titre).toBe('titre-apprenti')
    expect(solde(store.etat)).toBe(10)
    store.porterTitre(null)
    expect(store.etat.titre).toBeNull()
    store.porterTitre('titre-expert')
    expect(store.etat.titre).toBeNull()
  })
})
