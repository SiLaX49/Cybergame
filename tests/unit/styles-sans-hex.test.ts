import { describe, expect, it } from 'vitest'

const fichiers = import.meta.glob('/src/**/*.vue', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

/** Aucun composant n’est exempté. */
const EN_ATTENTE = new Set<string>([])

const COULEUR_LITTERALE = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i

function styles(source: string): string {
  return [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
}

describe('aucune couleur codée en dur dans les styles des composants', () => {
  it('trouve les composants', () => {
    expect(Object.keys(fichiers).length).toBeGreaterThan(40)
  })
  it.each(Object.keys(fichiers).filter((f) => !EN_ATTENTE.has(f)))('%s', (f) => {
    const lignes = styles(fichiers[f]!).split('\n').filter((l) => COULEUR_LITTERALE.test(l))
    expect(lignes).toEqual([])
  })
  it('la liste d’attente ne contient que des fichiers existants', () => {
    for (const f of EN_ATTENTE) expect(fichiers[f], f).toBeDefined()
  })
})
