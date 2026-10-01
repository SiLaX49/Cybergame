import { describe, expect, it } from 'vitest'
import { atteint, evaluerRobustesse } from '@/minigames/robustesse'

const niveau = (mdp: string, interdits: string[] = []) => evaluerRobustesse(mdp, interdits).niveau

describe('evaluerRobustesse', () => {
  it.each([
    ['', 'tres-faible'],
    ['chat', 'tres-faible'],
    ['chatbleu', 'faible'],
    ['Chatbleu7', 'moyen'],
    ['chat-bleu-mange', 'solide'],
    ['Tr0mb0n3!Kiwi', 'solide'],
    ['chat-bleu-mange-pizza', 'tres-solide'],
  ])('« %s » → %s', (mdp, attendu) => {
    expect(niveau(mdp)).toBe(attendu)
  })

  it('plafonne à « faible » une suite connue, un mot interdit ou des répétitions', () => {
    expect(niveau('azerty-girafe-violette')).toBe('faible')
    expect(niveau('lea-mange-une-pizza', ['Léa'])).toBe('faible')
    expect(niveau('aaaaaaaaaaaaaaaaaa')).toBe('faible')
  })

  it('coche les conseils', () => {
    const conseils = evaluerRobustesse('chat-bleu-mange-pizza', ['Léa']).conseils
    expect(conseils.every((c) => c.ok)).toBe(true)
    const faible = evaluerRobustesse('1234', [])
    expect(faible.conseils.find((c) => c.id === 'longueur')?.ok).toBe(false)
    expect(faible.conseils.find((c) => c.id === 'suite')?.ok).toBe(false)
  })

  it('donne une estimation de temps par niveau', () => {
    expect(evaluerRobustesse('chat').temps).toBe('quelques secondes')
    expect(evaluerRobustesse('chat-bleu-mange-pizza').temps).toBe('des siècles')
  })

  it('reste cohérent avec un texte très long ou des emojis', () => {
    expect(niveau('girafe-'.repeat(80))).toBe('faible')
    expect(niveau('🐱🐶🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮')).not.toBe('tres-solide')
    expect(() => evaluerRobustesse('x'.repeat(500))).not.toThrow()
  })

  it('compare un niveau à un objectif', () => {
    expect(atteint('solide', 'solide')).toBe(true)
    expect(atteint('tres-solide', 'solide')).toBe(true)
    expect(atteint('solide', 'tres-solide')).toBe(false)
  })
})
