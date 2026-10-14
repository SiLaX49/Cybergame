// @vitest-environment node
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildContent } from '../../../scripts/build-content'
import type { Scenario } from '../../../src/content/schema'
import { ordreAffichage } from '../../../src/engine/ordre'

const scenarios = buildContent(join(process.cwd(), 'content')).missions.flatMap((m) =>
  m.etapes.filter((e): e is Scenario => e.type === 'scenario'),
)
const ids = (liste: { id: string }[]) => liste.map((x) => x.id)

describe('ordreAffichage', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]

  it('est déterministe pour une même graine', () => {
    expect(ids(ordreAffichage(items, 'sms-colis'))).toEqual(ids(ordreAffichage(items, 'sms-colis')))
  })

  it('renvoie une permutation, sans modifier la liste d’origine', () => {
    const copie = [...items]
    const resultat = ordreAffichage(items, 'graine')
    expect(ids(resultat).sort()).toEqual(['a', 'b', 'c', 'd'])
    expect(items).toEqual(copie)
  })

  it('l’ordre des choix ne trahit plus leur qualité', () => {
    expect(scenarios.length).toBeGreaterThan(15)
    const ordres = scenarios.map((s) => ordreAffichage(s.choix, s.id).map((c) => c.qualite).join(','))
    const inchanges = scenarios.filter((s) => ids(ordreAffichage(s.choix, s.id)).join() === ids(s.choix).join())
    expect(inchanges.length).toBeLessThan(scenarios.length / 3)
    // Aucune position n'est réservée à une qualité donnée.
    for (let i = 0; i < 3; i++) {
      const qualitesEnPosition = new Set(ordres.map((o) => o.split(',')[i]))
      expect(qualitesEnPosition.size, `position ${i + 1}`).toBeGreaterThan(1)
    }
  })
})
