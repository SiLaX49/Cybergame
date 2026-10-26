import { describe, expect, it } from 'vitest'
import type { Etape } from '@/content/schema'
import { aVenir, bifurcation, choixDeBifurcation, choixReparation, etiquetteRoute, etapeSuivante, longueurRoute, numerosLieux, routesDe, schemaRoutes, successeurs, verifierRoutes } from '@/engine/routes'

type C = { id: string; qualite: 'bon' | 'risque' | 'aide'; suite?: string; route?: string }
const lieu = (id: string, choix: C[] = [{ id: 'b', qualite: 'bon' }, { id: 'r', qualite: 'risque' }, { id: 'a', qualite: 'aide' }], suite?: string) =>
  ({ type: 'lieu', id, lieu: id, decor: 'cour', guide: 'g', question: 'q', aRetenir: 'x', suite,
     choix: choix.map((c) => ({ texte: c.id, reaction: 'r', ...c })) }) as unknown as Etape

const lineaire = ['l1', 'l2', 'l3', 'l4', 'l5'].map((id) => lieu(id))
const fourche = [
  lieu('l1'),
  lieu('l2', [{ id: 'b', qualite: 'bon', suite: 'a3', route: 'je fais seul' }, { id: 'r', qualite: 'risque' }, { id: 'a', qualite: 'aide', suite: 'b3', route: 'je demande' }]),
  lieu('a3'),
  lieu('a4', undefined, 'l5'),
  lieu('b3'),
  lieu('b4'),
  lieu('l5'),
]

describe('routes', () => {
  it('linéaire : étape suivante du fichier, une seule route', () => {
    expect(etapeSuivante(lineaire, 'l2', 'b')).toBe('l3')
    expect(etapeSuivante(lineaire, 'l5', 'b')).toBeNull()
    expect(routesDe(lineaire)).toEqual([['l1', 'l2', 'l3', 'l4', 'l5']])
    expect(longueurRoute(lineaire)).toBe(5)
    expect(verifierRoutes(lineaire)).toEqual([])
    expect(bifurcation(lineaire, 'l2')).toBeNull()
  })
  it('fourche : suite du choix, puis suite du lieu, puis fichier', () => {
    expect(etapeSuivante(fourche, 'l2', 'b')).toBe('a3')
    expect(etapeSuivante(fourche, 'l2', 'a')).toBe('b3')
    expect(etapeSuivante(fourche, 'a4', 'b')).toBe('l5')
    expect(etapeSuivante(fourche, 'b4', 'a')).toBe('l5')
    expect(successeurs(fourche, 'l2')).toEqual(['a3', 'b3'])
    expect(bifurcation(fourche, 'l2')).toEqual({ bon: 'a3', aide: 'b3' })
  })
  it('fourche : deux routes de même longueur, route « bon » d’abord', () => {
    expect(routesDe(fourche)).toEqual([
      ['l1', 'l2', 'a3', 'a4', 'l5'],
      ['l1', 'l2', 'b3', 'b4', 'l5'],
    ])
    expect(longueurRoute(fourche)).toBe(5)
    expect(verifierRoutes(fourche)).toEqual([])
  })
  it('à venir : inconnu tant que la bifurcation n’est pas décidée', () => {
    expect(aVenir(fourche, 'l1')).toEqual(['l2', null, null, 'l5'])
    expect(aVenir(fourche, 'a3')).toEqual(['a4', 'l5'])
    expect(aVenir(fourche, 'b3')).toEqual(['b4', 'l5'])
    expect(aVenir(lineaire, 'l3')).toEqual(['l4', 'l5'])
  })
  it('refuse : suite inconnue, sur soi, sur un choix risqué', () => {
    const e1 = verifierRoutes([lieu('l1', [{ id: 'b', qualite: 'bon', suite: 'x' }, { id: 'a', qualite: 'aide' }]), ...lineaire.slice(1)])
    expect(e1.map((e) => e.message).join('\n')).toMatch(/inconnue/)
    const e2 = verifierRoutes([lieu('l1', undefined, 'l1'), ...lineaire.slice(1)])
    expect(e2.map((e) => e.message).join('\n')).toMatch(/elle-même/)
    const e3 = verifierRoutes([lieu('l1', [{ id: 'b', qualite: 'bon' }, { id: 'r', qualite: 'risque', suite: 'l3' }, { id: 'a', qualite: 'aide' }]), ...lineaire.slice(1)])
    expect(e3.map((e) => e.message).join('\n')).toMatch(/risqué/)
  })
  it('refuse : boucle, étape inatteignable, routes de longueurs différentes', () => {
    const boucle = [lieu('l1'), lieu('l2', undefined, 'l1'), lieu('l3'), lieu('l4'), lieu('l5')]
    expect(verifierRoutes(boucle).map((e) => e.message).join('\n')).toMatch(/boucle/)
    const orpheline = [lieu('l1', undefined, 'l3'), lieu('l2'), lieu('l3'), lieu('l4'), lieu('l5')]
    expect(verifierRoutes(orpheline).map((e) => e.message).join('\n')).toMatch(/inatteignable/)
    const inegale = [
      lieu('l1'),
      lieu('l2', [{ id: 'b', qualite: 'bon', suite: 'a3' }, { id: 'a', qualite: 'aide', suite: 'b3' }]),
      lieu('a3', undefined, 'l5'),
      lieu('b3'),
      lieu('b4'),
      lieu('l5'),
    ]
    expect(verifierRoutes(inegale).map((e) => e.message).join('\n')).toMatch(/même longueur/)
  })
  it('refuse : bifurcation qui ne sépare pas bon et aide', () => {
    const deuxBons = [
      lieu('l1'),
      lieu('l2', [{ id: 'b', qualite: 'bon', suite: 'a3' }, { id: 'b2', qualite: 'bon', suite: 'b3' }, { id: 'a', qualite: 'aide', suite: 'a3' }]),
      lieu('a3'), lieu('a4', undefined, 'l5'), lieu('b3'), lieu('b4'), lieu('l5'),
    ]
    expect(verifierRoutes(deuxBons).map((e) => e.message).join('\n')).toMatch(/bon.*aide/)
  })
})

describe('ordre des choix dans le fichier', () => {
  const aideAvantBon = [
    lieu('l1'),
    lieu('l2', [
      { id: 'a', qualite: 'aide', suite: 'b3', route: 'je demande' },
      { id: 'r', qualite: 'risque' },
      { id: 'b', qualite: 'bon', suite: 'a3', route: 'je fais seul' },
    ]),
    lieu('a3'), lieu('a4', undefined, 'l5'), lieu('b3'), lieu('b4'), lieu('l5'),
  ]
  it('la route « bon » reste la première, donc « a », même si le choix aide est écrit avant', () => {
    expect(routesDe(aideAvantBon)).toEqual(routesDe(fourche))
    expect(numerosLieux(aideAvantBon)).toEqual(numerosLieux(fourche))
    expect(successeurs(aideAvantBon, 'l2')).toEqual(['a3', 'b3'])
    expect(bifurcation(aideAvantBon, 'l2')).toEqual({ bon: 'a3', aide: 'b3' })
    expect(verifierRoutes(aideAvantBon)).toEqual([])
  })
  it('étiquettes courtes des choix de la bifurcation', () => {
    expect(choixDeBifurcation(aideAvantBon)).toMatchObject({ id: 'l2', bon: 'je fais seul', aide: 'je demande' })
    expect(etiquetteRoute({ texte: 'Je vérifie moi-même.' })).toBe('Je vérifie moi-même')
  })
  it('refuse une bifurcation sans étiquette « route »', () => {
    const sans = [lieu('l1'), lieu('l2', [{ id: 'b', qualite: 'bon', suite: 'a3' }, { id: 'a', qualite: 'aide', suite: 'b3', route: 'je demande' }]),
      lieu('a3'), lieu('a4', undefined, 'l5'), lieu('b3'), lieu('b4'), lieu('l5')]
    expect(verifierRoutes(sans)).toEqual([{ chemin: ['etapes', 1, 'choix', 0, 'route'], message: expect.stringMatching(/étiquette « route »/) }])
  })
})

describe('numéros affichés des lieux', () => {
  it('fourche : tronc commun, a/b sur les routes, jonction', () => {
    expect(numerosLieux(fourche)).toEqual({ l1: '1', l2: '2', a3: '3a', a4: '4a', b3: '3b', b4: '4b', l5: '5' })
  })
  it('linéaire : 1 à n', () => {
    expect(numerosLieux(lineaire)).toEqual({ l1: '1', l2: '2', l3: '3', l4: '4', l5: '5' })
  })
  it('schéma en texte des routes', () => {
    expect(schemaRoutes(fourche)).toBe('Lieux 1 – 2, puis selon le choix : 3a – 4a ou 3b – 4b, puis 5')
    expect(schemaRoutes(lineaire)).toBeNull()
  })
})

describe('route de réparation (troisième branche)', () => {
  const trois = [
    lieu('l1'),
    lieu('l2', [
      { id: 'b', qualite: 'bon', suite: 'a3', route: 'je fais seul' },
      { id: 'r', qualite: 'risque', suite: 'c3', route: 'je fonce' },
      { id: 'r2', qualite: 'risque' },
      { id: 'a', qualite: 'aide', suite: 'b3', route: 'je demande' },
    ]),
    lieu('a3'), lieu('a4', undefined, 'l5'),
    lieu('b3'), lieu('b4', undefined, 'l5'),
    lieu('c3'), lieu('c4'),
    lieu('l5'),
  ]
  const messages = (e: Etape[]) => verifierRoutes(e).map((x) => x.message).join('\n')
  const avec = (choix: C[], extra: Etape[] = []) => [
    lieu('l1'), lieu('l2', choix),
    lieu('a3'), lieu('a4', undefined, 'l5'), lieu('b3'), lieu('b4', undefined, 'l5'), lieu('c3'), lieu('c4'), ...extra, lieu('l5'),
  ]
  const bonAide: C[] = [{ id: 'b', qualite: 'bon', suite: 'a3', route: 'je fais seul' }, { id: 'a', qualite: 'aide', suite: 'b3', route: 'je demande' }]

  it('la réparation est la troisième route', () => {
    expect(successeurs(trois, 'l2')).toEqual(['a3', 'b3', 'c3'])
    expect(bifurcation(trois, 'l2')).toEqual({ bon: 'a3', aide: 'b3', reparation: 'c3' })
    expect(routesDe(trois)).toEqual([
      ['l1', 'l2', 'a3', 'a4', 'l5'],
      ['l1', 'l2', 'b3', 'b4', 'l5'],
      ['l1', 'l2', 'c3', 'c4', 'l5'],
    ])
    expect(verifierRoutes(trois)).toEqual([])
    expect(choixReparation(trois, 'l2')).toBe('r')
    expect(choixReparation(fourche, 'l2')).toBeNull()
  })
  it('numéros et schéma', () => {
    expect(numerosLieux(trois)).toMatchObject({ c3: '3c', c4: '4c', l5: '5' })
    expect(schemaRoutes(trois)).toBe('Lieux 1 – 2, puis selon le choix : 3a – 4a ou 3b – 4b ou 3c – 4c, puis 5')
  })
  it('choixDeBifurcation donne la réparation', () => {
    expect(choixDeBifurcation(trois)).toMatchObject({ id: 'l2', reparation: 'je fonce', texteReparation: 'r' })
  })
  it('aVenir avant la bifurcation', () => {
    expect(aVenir(trois, 'l1')).toEqual(['l2', null, null, 'l5'])
  })
  it('refuse : risque à suite hors bifurcation', () => {
    const e = lineaire.map((l) => l)
    e[1] = lieu('l2', [{ id: 'b', qualite: 'bon' }, { id: 'r', qualite: 'risque', suite: 'l4' }, { id: 'a', qualite: 'aide' }])
    expect(messages(e)).toMatch(/un choix risqué fait rester sur place : pas de suite/)
  })
  it('refuse : deux risques à suite', () => {
    const e = avec([...bonAide, { id: 'r', qualite: 'risque', suite: 'c3', route: 'x' }, { id: 'r2', qualite: 'risque', suite: 'c3', route: 'y' }])
    expect(messages(e)).toMatch(/au plus un choix risqué qui mène à une route de réparation/)
  })
  it('refuse : risque vers la même cible que bon', () => {
    const e = avec([...bonAide, { id: 'r', qualite: 'risque', suite: 'a3', route: 'x' }])
    expect(messages(e)).toMatch(/les routes d’une bifurcation mènent à des lieux différents/)
  })
  it('refuse : risque à suite sans route', () => {
    const e = avec([...bonAide, { id: 'r', qualite: 'risque', suite: 'c3' }])
    expect(messages(e)).toMatch(/étiquette « route »/)
  })
  it('refuse : route de réparation plus longue', () => {
    const e = [
      lieu('l1'), lieu('l2', [...bonAide, { id: 'r', qualite: 'risque', suite: 'c3', route: 'x' }]),
      lieu('a3'), lieu('a4', undefined, 'l5'), lieu('b3'), lieu('b4', undefined, 'l5'), lieu('c3'), lieu('c4'), lieu('c5'), lieu('l5'),
    ]
    expect(messages(e)).toMatch(/même longueur/)
  })
  it('refuse : récupération sur le choix de réparation', () => {
    const e = avec([...bonAide, { id: 'r', qualite: 'risque', suite: 'c3', route: 'x' }])
    ;(e[1] as unknown as { recuperation: unknown }).recuperation = { action: 'capture-preuve', siChoix: ['r'] }
    expect(messages(e)).toMatch(/le choix qui mène à la route de réparation n’a pas de récupération : la route répare/)
  })
})
