import { creerAcces } from '@/content/acces'
import { missionFixture, rappelFixture, themesFixture } from './fixtures'

export const contentMock = creerAcces({
  generatedAt: '2026-09-01T10:00:00.000Z',
  themes: themesFixture(),
  missions: [
    missionFixture(),
    missionFixture({
      id: 'm-sensible',
      theme: 'harcelement',
      titre: 'Mission sensible',
      fiche: { deroulement: 'Déroulé.', siRevelation: 'Prévenir le ou la CPE et l’infirmier·e scolaire.' },
    }),
    rappelFixture(),
  ],
})
