import { describe, expect, it } from 'vitest'
import {
  chargerProgression,
  effacerProgression,
  migrer,
  progressionVide,
  sauverProgression,
  STORAGE_KEY,
} from '@/store/progress'
import { MemoryStorage, StorageQuiRefuse } from './memory-storage'

describe('progression', () => {
  it('part d’une progression vide sans stockage', () => {
    expect(chargerProgression(null)).toEqual(progressionVide())
    expect(progressionVide()).toMatchObject({
      version: 1,
      tranche: null,
      mode: null,
      reglages: { taille: 'normal', interligne: 'normal', lectureSimple: false, animations: true, chrono: false },
      missions: {},
      rappels: {},
    })
  })

  it('sauve puis recharge', () => {
    const s = new MemoryStorage()
    const p = { ...progressionVide(), tranche: '6e' as const }
    expect(sauverProgression(s, p)).toBe(true)
    expect(chargerProgression(s).tranche).toBe('6e')
  })

  it('repart de zéro si les données sont corrompues', () => {
    const s = new MemoryStorage()
    s.setItem(STORAGE_KEY, '{pas du json')
    expect(chargerProgression(s)).toEqual(progressionVide())
    s.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tranche: 'cm2' }))
    expect(chargerProgression(s)).toEqual(progressionVide())
  })

  it('refuse une version inconnue', () => {
    expect(migrer({ version: 99 })).toBeNull()
    expect(migrer('texte')).toBeNull()
    expect(migrer({ version: 1 })).toEqual(progressionVide())
  })

  it('signale l’échec d’écriture sans lever d’erreur', () => {
    expect(sauverProgression(new StorageQuiRefuse(), progressionVide())).toBe(false)
    expect(sauverProgression(null, progressionVide())).toBe(false)
  })

  it('efface la clé', () => {
    const s = new MemoryStorage()
    sauverProgression(s, progressionVide())
    effacerProgression(s)
    expect(s.getItem(STORAGE_KEY)).toBeNull()
    expect(() => effacerProgression(null)).not.toThrow()
  })
})
