import { describe, expect, it } from 'vitest'
import { STORAGE_KEY } from '@/store/progress'
import { creerStore } from '@/store/useProgress'
import { MemoryStorage, StorageQuiRefuse } from './memory-storage'

const lire = (s: Storage) => JSON.parse(s.getItem(STORAGE_KEY) ?? 'null')

describe('store de progression', () => {
  it('persiste chaque modification', () => {
    const s = new MemoryStorage()
    const store = creerStore(s)
    store.choisirTranche('lycee')
    store.choisirMode('classe')
    store.modifierReglages({ taille: 'grand' })
    expect(lire(s)).toMatchObject({ tranche: 'lycee', mode: 'classe', reglages: { taille: 'grand' } })
    expect(store.persistant.value).toBe(true)
  })

  it('enregistre une mission terminée', () => {
    const s = new MemoryStorage()
    const store = creerStore(s)
    store.enregistrerMission('m-test', ['mission-accomplie'], { 'sc-1': 'verif' }, new Date('2026-09-01T10:00:00Z'))
    expect(lire(s).missions['m-test']).toEqual({
      termineeLe: '2026-09-01T10:00:00.000Z',
      badges: ['mission-accomplie'],
      choix: { 'sc-1': 'verif' },
    })
  })

  it('rejouer une mission garde la première date, cumule les badges et garde les derniers choix', () => {
    const store = creerStore(new MemoryStorage())
    store.enregistrerMission('m-test', ['mission-accomplie', 'reflexe-verif'], { 'sc-1': 'aide' }, new Date('2026-09-01T10:00:00Z'))
    store.enregistrerMission('m-test', ['mission-accomplie', 'oeil-de-lynx'], { 'sc-1': 'verif' }, new Date('2026-09-05T10:00:00Z'))
    expect(store.etat.missions['m-test']).toEqual({
      termineeLe: '2026-09-01T10:00:00.000Z',
      badges: ['mission-accomplie', 'reflexe-verif', 'oeil-de-lynx'],
      choix: { 'sc-1': 'verif' },
    })
  })

  it('compte les rappels faits', () => {
    const store = creerStore(new MemoryStorage())
    store.enregistrerRappel('r-6e', 'piege', new Date('2026-09-08T10:00:00Z'))
    store.enregistrerRappel('r-6e', 'verifie', new Date('2026-10-01T10:00:00Z'))
    expect(store.etat.rappels['r-6e']).toEqual({
      faitLe: '2026-10-01T10:00:00.000Z',
      fois: 2,
      resultatSurprise: 'verifie',
    })
  })

  it('fonctionne sans stockage, en le signalant', () => {
    const store = creerStore(null)
    store.choisirTranche('6e')
    expect(store.etat.tranche).toBe('6e')
    expect(store.persistant.value).toBe(false)
  })

  it('signale un stockage qui refuse les écritures', () => {
    const store = creerStore(new StorageQuiRefuse())
    store.choisirTranche('6e')
    expect(store.etat.tranche).toBe('6e')
    expect(store.persistant.value).toBe(false)
  })

  it('efface tout, y compris la clé', () => {
    const s = new MemoryStorage()
    const store = creerStore(s)
    store.choisirTranche('6e')
    store.effacer()
    expect(store.etat.tranche).toBeNull()
    expect(s.getItem(STORAGE_KEY)).toBeNull()
  })
})
