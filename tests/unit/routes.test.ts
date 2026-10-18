import { describe, expect, it } from 'vitest'
import type { Etape } from '@/content/schema'
import { aVenir, bifurcation, etapeSuivante, longueurRoute, routesDe, successeurs, verifierRoutes } from '@/engine/routes'

type C = { id: string; qualite: 'bon' | 'risque' | 'aide'; suite?: string }
const lieu = (id: string, choix: C[] = [{ id: 'b', qualite: 'bon' }, { id: 'r', qualite: 'risque' }, { id: 'a', qualite: 'aide' }], suite?: string) =>
  ({ type: 'lieu', id, lieu: id, decor: 'cour', guide: 'g', question: 'q', aRetenir: 'x', suite,
     choix: choix.map((c) => ({ texte: c.id, reaction: 'r', ...c })) }) as unknown as Etape

const lineaire = ['l1', 'l2', 'l3', 'l4', 'l5'].map((id) => lieu(id))
const fourche = [
  lieu('l1'),
  lieu('l2', [{ id: 'b', qualite: 'bon', suite: 'a3' }, { id: 'r', qualite: 'risque' }, { id: 'a', qualite: 'aide', suite: 'b3' }]),
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
