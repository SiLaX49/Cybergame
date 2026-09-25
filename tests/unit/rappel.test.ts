import { describe, expect, it } from 'vitest'
import { rappelDu } from '@/engine/rappel'

const jour = (n: number) => new Date(Date.UTC(2026, 8, 1 + n, 12))
const iso = (n: number) => jour(n).toISOString()

describe('rappelDu', () => {
  it('aucun rappel sans mission terminée', () => {
    expect(rappelDu([], 0, jour(40))).toBeNull()
  })
  it('J+7 à partir de 7 jours après la première mission', () => {
    expect(rappelDu([iso(0)], 0, jour(6))).toBeNull()
    expect(rappelDu([iso(3), iso(0)], 0, jour(7))).toBe('J+7')
  })
  it('J+30 après un premier rappel', () => {
    expect(rappelDu([iso(0)], 1, jour(20))).toBeNull()
    expect(rappelDu([iso(0)], 1, jour(30))).toBe('J+30')
  })
  it('plus rien après deux rappels', () => {
    expect(rappelDu([iso(0)], 2, jour(90))).toBeNull()
  })
  it('ignore les dates illisibles', () => {
    expect(rappelDu(['pas une date'], 0, jour(40))).toBeNull()
  })
})
