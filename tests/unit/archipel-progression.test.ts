import { describe, expect, it } from 'vitest'
import { CHEMIN, ILES_CALMES, POSITIONS_LARGES, estIleCalme, nomIle } from '@/archipel/archipel'
import { etatIle, objetsSacoche, positionPersonnage } from '@/archipel/progression'
import { ILES } from '@/parcours/iles'

const fait = (jour: number) => ({ termineeLe: `2026-10-0${jour}T10:00:00.000Z` })

describe('données de l’archipel', () => {
  it('le chemin passe une fois par chaque île à parcours', () => {
    expect([...CHEMIN].sort()).toEqual([...ILES].sort())
  })
  it('les îles calmes sont les thèmes sensibles, hors du chemin', () => {
    expect(ILES_CALMES).toEqual(['harcelement', 'rencontres'])
    for (const c of ILES_CALMES) expect(CHEMIN as readonly string[]).not.toContain(c)
    expect(estIleCalme('harcelement')).toBe(true)
    expect(estIleCalme('phishing')).toBe(false)
  })
  it('nomme chaque île et chaque position existe', () => {
    expect(nomIle('phishing')).toBe('Île aux hameçons')
    expect(nomIle('harcelement')).toBe('Île de l’entraide')
    expect(nomIle('rencontres')).toBe('Île du phare')
    expect(nomIle('inconnu')).toBeUndefined()
    for (const id of [...CHEMIN, ...ILES_CALMES, 'port'] as const) {
      const p = POSITIONS_LARGES[id]
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(100)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(100)
    }
  })
})

describe('etatIle', () => {
  const missions = [
    { id: 'p-parcours', format: 'parcours' as const },
    { id: 'p-a', format: 'classique' as const },
    { id: 'p-b', format: 'classique' as const },
  ]
  it('compte les missions terminées de la tranche', () => {
    expect(etatIle(missions, { 'p-a': fait(1), autre: fait(2) }, false)).toEqual({
      terminees: 1, total: 3, aParcours: true, objetGagne: false, complete: false,
    })
  })
  it('l’objet n’est gagné qu’avec le parcours terminé', () => {
    expect(etatIle(missions, { 'p-parcours': fait(1) }, false).objetGagne).toBe(true)
  })
  it('complète quand tout est fait', () => {
    const tout = { 'p-parcours': fait(1), 'p-a': fait(2), 'p-b': fait(3) }
    expect(etatIle(missions, tout, false).complete).toBe(true)
  })
  it('sans parcours dans la tranche : rien à gagner', () => {
    const e = etatIle([{ id: 'p-a', format: 'classique' }], { 'p-a': fait(1) }, false)
    expect(e).toMatchObject({ aParcours: false, objetGagne: false, complete: true })
  })
  it('île vide : jamais complète', () => {
    expect(etatIle([], {}, false)).toEqual({ terminees: 0, total: 0, aParcours: false, objetGagne: false, complete: false })
  })
  it('île calme : ni objet ni drapeau', () => {
    const e = etatIle([{ id: 'h-a', format: 'classique' }], { 'h-a': fait(1) }, true)
    expect(e).toEqual({ terminees: 1, total: 1, aParcours: false, objetGagne: false, complete: false })
  })
})

describe('positionPersonnage', () => {
  const missions = [
    { id: 'p-a', theme: 'phishing' },
    { id: 'c-a', theme: 'comptes' },
  ]
  it('au port si rien n’est terminé dans la tranche', () => {
    expect(positionPersonnage(missions, {})).toBe('port')
    expect(positionPersonnage(missions, { 'x-autre-tranche': fait(9) })).toBe('port')
  })
  it('sur l’île de la dernière mission terminée', () => {
    expect(positionPersonnage(missions, { 'p-a': fait(3), 'c-a': fait(2) })).toBe('phishing')
    expect(positionPersonnage(missions, { 'p-a': fait(1), 'c-a': fait(2) })).toBe('comptes')
  })
})

describe('objetsSacoche', () => {
  it('liste les îles à parcours, gagnées ou non, dans l’ordre donné', () => {
    const iles = [
      { theme: 'phishing', missions: [{ id: 'a', format: 'parcours' as const }] },
      { theme: 'comptes', missions: [{ id: 'b', format: 'parcours' as const }] },
      { theme: 'vie-privee', missions: [{ id: 'c', format: 'classique' as const }] },
      { theme: 'jeux-achats', missions: [] },
    ]
    expect(objetsSacoche(iles, { a: fait(1) }).map((o) => [o.theme, o.gagne])).toEqual([
      ['phishing', true],
      ['comptes', false],
    ])
  })
})
