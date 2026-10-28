import { describe, expect, it } from 'vitest'
import printCss from '@/styles/print.css?raw'

describe('print.css', () => {
  const debut = printCss.indexOf('@media print')
  const ouvre = printCss.indexOf('{', printCss.indexOf(':root,', debut))
  const selecteurs = printCss.slice(printCss.indexOf(':root,', debut), ouvre)
  const corps = printCss.slice(ouvre, printCss.indexOf('}', ouvre))

  it('redéclare la palette claire pour les thèmes sombre et automatique', () => {
    expect(selecteurs).toContain(":root[data-theme='sombre']")
    expect(selecteurs).toContain(":root:not([data-theme='clair']):not([data-theme='sombre'])")
  })
  it('force texte noir sur fond blanc', () => {
    expect(corps).toMatch(/--texte:\s*#000000/)
    expect(corps).toMatch(/--fond:\s*#ffffff/)
    expect(corps).toContain('color-scheme: light')
  })
})

describe('print.css : coquille', () => {
  it('n’imprime ni la barre latérale, ni l’en-tête, ni le pied de page', () => {
    const masques = printCss.slice(printCss.indexOf('.app-header,'), printCss.indexOf('display: none', printCss.indexOf('.app-header,')))
    for (const s of ['.app-header', '.barre-laterale', '.pied']) expect(masques).toContain(s)
  })
})
