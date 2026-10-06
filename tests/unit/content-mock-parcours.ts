import { creerAcces } from '@/content/acces'
import { leviersFixture, missionFixture, parcoursFixture, themesFixture } from './fixtures'

export const contentMock = creerAcces({
  generatedAt: '2026-10-05T10:00:00.000Z',
  themes: themesFixture(),
  leviers: leviersFixture(),
  missions: [
    missionFixture(),
    parcoursFixture({ theme: 'jeux-achats' }),
    // Un parcours dont le thème n’a pas d’île : pas de personnage ni de scène, la progression classique.
    parcoursFixture({ id: 'p-hors-ile', titre: 'Un parcours sans île', theme: 'harcelement' }),
  ],
})
