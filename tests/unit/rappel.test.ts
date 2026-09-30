import { describe, expect, it } from 'vitest'
import { rappelDu } from '@/engine/rappel'

const jour = (n: number) => new Date(Date.UTC(2026, 8, 1 + n, 12))
const iso = (n: number) => jour(n).toISOString()

describe('rappelDu', () => {
  const fait = (n: number, fois = 1) => ({ faitLe: iso(n), fois })

  it('aucun rappel sans mission terminée', () => {
    expect(rappelDu([], [], jour(40))).toBeNull()
  })
  it('J+7 à partir de 7 jours après la première mission', () => {
    expect(rappelDu([iso(0)], [], jour(6))).toBeNull()
    expect(rappelDu([iso(3), iso(0)], [], jour(7))).toBe('J+7')
  })
  it('J+30 après un premier rappel', () => {
    expect(rappelDu([iso(0)], [fait(8)], jour(20))).toBeNull()
    expect(rappelDu([iso(0)], [fait(8)], jour(30))).toBe('J+30')
  })
  it('plus rien après deux rappels', () => {
    expect(rappelDu([iso(0)], [fait(35, 2)], jour(90))).toBeNull()
  })
  it('un rappel joué avant la première mission n’annule pas le J+7', () => {
    expect(rappelDu([iso(2)], [fait(0)], jour(9))).toBe('J+7')
    expect(rappelDu([iso(2)], [fait(0)], jour(8))).toBeNull()
  })
  it('un rappel joué avant la première mission puis à J+7 laisse venir le J+30', () => {
    // Un seul enregistrement par rappel : dernière date + nombre total de fois.
    expect(rappelDu([iso(2)], [{ faitLe: iso(10), fois: 2 }], jour(31))).toBeNull()
    expect(rappelDu([iso(2)], [{ faitLe: iso(10), fois: 2 }], jour(32))).toBe('J+30')
  })
  it('ignore les dates illisibles', () => {
    expect(rappelDu(['pas une date'], [], jour(40))).toBeNull()
    expect(rappelDu([iso(0)], [{ faitLe: 'pas une date', fois: 1 }], jour(8))).toBe('J+7')
  })
})
