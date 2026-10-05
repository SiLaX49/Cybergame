import { creerAcces } from '@/content/acces'
import { leviersFixture, missionFixture, parcoursFixture, themesFixture } from './fixtures'

export const contentMock = creerAcces({
  generatedAt: '2026-10-05T10:00:00.000Z',
  themes: themesFixture(),
  leviers: leviersFixture(),
  missions: [missionFixture(), parcoursFixture({ theme: 'jeux-achats' })],
})
