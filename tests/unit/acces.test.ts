import { describe, expect, it } from 'vitest'
import { creerAcces } from '@/content/acces'
import { leviersFixture, missionFixture, rappelFixture, themesFixture } from './fixtures'

const acces = creerAcces({
  generatedAt: '2026-09-01T10:00:00.000Z',
  themes: themesFixture(),
  leviers: leviersFixture(),
  missions: [missionFixture(), missionFixture({ id: 'm-lycee', tranches: ['lycee'] }), rappelFixture()],
})

describe('creerAcces', () => {
  it('filtre les missions par tranche et par thème, sans les rappels', () => {
    expect(acces.missionsPour('6e', 'phishing').map((m) => m.id)).toEqual(['m-test'])
    expect(acces.missionsPour('lycee', 'phishing').map((m) => m.id)).toEqual(['m-lycee'])
    expect(acces.missionsPour('6e', 'jeux-achats')).toEqual([])
  })

  it('trouve le rappel de la tranche', () => {
    expect(acces.rappelPour('6e')?.id).toBe('r-test')
    expect(acces.rappelPour('lycee')).toBeUndefined()
  })

  it('trouve missions et thèmes par identifiant', () => {
    expect(acces.getMission('m-test')?.titre).toBe('Mission test')
    expect(acces.getMission('absente')).toBeUndefined()
    expect(acces.getTheme('harcelement')?.sensible).toBe(true)
  })

  it('expose les leviers', () => {
    expect(acces.getLeviers().leviers.urgence.libelle).toBe('Il fallait faire vite')
  })
})
