import { describe, expect, it } from 'vitest'
import tokensCss from '@/styles/tokens.css?raw'
import { CLAIR, SOMBRE, THEMES_COULEURS, ratioContraste } from '@/styles/palette'

type Paire = [string, string]
const PALETTES = { clair: CLAIR, sombre: SOMBRE } as const

const TEXTE: Paire[] = [
  ['texte', 'fond'], ['texte', 'surface'], ['texte', 'surface-2'],
  ['texte-doux', 'fond'], ['texte-doux', 'surface'], ['texte-doux', 'surface-2'],
  ['primaire-texte', 'primaire'],
  ['primaire', 'fond'], ['primaire', 'surface'], ['primaire', 'surface-2'],
  ['bon', 'surface'], ['risque', 'surface'], ['aide', 'surface'],
  ['bon', 'bon-fond'], ['risque', 'risque-fond'], ['aide', 'aide-fond'],
  ['texte', 'bon-fond'], ['texte', 'risque-fond'], ['texte', 'aide-fond'],
  ['texte-doux', 'bon-fond'], ['texte-doux', 'risque-fond'], ['texte-doux', 'aide-fond'],
  ...THEMES_COULEURS.flatMap((t): Paire[] => [['texte', `teinte-${t}`], ['texte-doux', `teinte-${t}`]]),
]
const INTERFACE: Paire[] = [
  ['bord-fort', 'fond'], ['bord-fort', 'surface'],
  ...THEMES_COULEURS.flatMap((t): Paire[] => [
    [`accent-${t}`, 'surface'], [`accent-${t}`, 'surface-2'], [`accent-${t}`, `teinte-${t}`],
  ]),
]
const FONDS_FOCUS = ['fond', 'surface', 'surface-2', 'bon-fond', 'risque-fond', 'aide-fond']

describe('ratioContraste', () => {
  it('donne 21 pour noir sur blanc et 1 pour une couleur sur elle-même', () => {
    expect(ratioContraste('#000000', '#ffffff')).toBeCloseTo(21, 1)
    expect(ratioContraste('#5b3df5', '#5b3df5')).toBeCloseTo(1, 5)
  })
})

for (const [nom, p] of Object.entries(PALETTES)) {
  describe(`palette ${nom}`, () => {
    it('définit les mêmes jetons dans les deux modes', () => {
      expect(Object.keys(p).sort()).toEqual(Object.keys(CLAIR).sort())
    })
    it.each(TEXTE)('texte %s sur %s ≥ 4,5:1', (a, b) => {
      expect(p[a], a).toBeDefined()
      expect(p[b], b).toBeDefined()
      expect(ratioContraste(p[a]!, p[b]!)).toBeGreaterThanOrEqual(4.5)
    })
    it.each(INTERFACE)('interface %s sur %s ≥ 3:1', (a, b) => {
      expect(ratioContraste(p[a]!, p[b]!)).toBeGreaterThanOrEqual(3)
    })
    it.each(FONDS_FOCUS)('anneau de focus visible sur %s', (fond) => {
      const meilleur = Math.max(ratioContraste(p.focus!, p[fond]!), ratioContraste(p['focus-lisere']!, p[fond]!))
      expect(meilleur).toBeGreaterThanOrEqual(3)
    })
  })
}

/** Extrait les déclarations `--nom: valeur;` du premier bloc dont le sélecteur commence par `selecteur`. */
function bloc(selecteur: string): Record<string, string> {
  const debut = tokensCss.indexOf(selecteur)
  expect(debut, selecteur).toBeGreaterThanOrEqual(0)
  const ouvre = tokensCss.indexOf('{', debut)
  const ferme = tokensCss.indexOf('}', ouvre)
  const corps = tokensCss.slice(ouvre + 1, ferme)
  return Object.fromEntries([...corps.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1]!, m[2]!.toLowerCase()]))
}

describe('tokens.css reprend palette.ts', () => {
  it('mode clair (racine)', () => {
    expect(bloc(':root,')).toEqual(CLAIR)
  })
  it('mode sombre forcé', () => {
    expect(bloc(":root[data-theme='sombre']")).toEqual(SOMBRE)
  })
  it('mode automatique sombre, y compris sans attribut data-theme', () => {
    expect(tokensCss).toContain('@media (prefers-color-scheme: dark)')
    expect(bloc(":root:not([data-theme='clair']):not([data-theme='sombre'])")).toEqual(SOMBRE)
  })
  it('chaque thème a son sélecteur d’accent', () => {
    for (const t of THEMES_COULEURS) {
      expect(tokensCss).toContain(`[data-accent='${t}'] { --accent: var(--accent-${t}); --teinte: var(--teinte-${t}); }`)
    }
  })
})
