import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Hulotte from '@/ui/Hulotte.vue'
import sourceHulotte from '@/ui/Hulotte.vue?raw'
import PastilleTheme from '@/ui/PastilleTheme.vue'
import { EXPRESSIONS_HULOTTE } from '@/ui/hulotte'

describe('Hulotte', () => {
  it.each(EXPRESSIONS_HULOTTE)('rend l’expression %s, décorative', (expression) => {
    const w = mount(Hulotte, { props: { expression, taille: 64 } })
    const svg = w.find('svg.hulotte')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('focusable')).toBe('false')
    expect(svg.attributes('data-expression')).toBe(expression)
    expect(svg.attributes('width')).toBe('64')
    expect(w.findAll('.h-corps').length).toBeGreaterThan(0)
  })
  it('ne fait la fête qu’en « bravo »', () => {
    expect(mount(Hulotte, { props: { expression: 'bravo' } }).find('.h-etoiles').exists()).toBe(true)
    for (const e of EXPRESSIONS_HULOTTE.filter((x) => x !== 'bravo')) {
      expect(mount(Hulotte, { props: { expression: e } }).find('.h-etoiles').exists()).toBe(false)
    }
  })
  it('prend toutes ses couleurs dans les jetons', () => {
    expect(sourceHulotte).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(sourceHulotte).toContain('var(--hulotte-corps)')
  })
})

describe('PastilleTheme', () => {
  it('porte l’accent du thème et reste décorative', () => {
    const w = mount(PastilleTheme, { props: { theme: { id: 'phishing', icone: 'Fish' } } })
    const s = w.find('.pastille-theme')
    expect(s.attributes('data-accent')).toBe('phishing')
    expect(s.attributes('aria-hidden')).toBe('true')
    expect(s.find('svg').exists()).toBe(true)
  })
})
