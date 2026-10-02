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
    ['Tr0mb0n3!Kiwi', 'moyen'],
    ['Chocolatine1', 'moyen'],
    ['Chocolatine2024!', 'solide'],
    ['chat-bleu-mange-pizza', 'tres-solide'],
    ['girafe-violette-sous-la-pluie', 'tres-solide'],
  ])('« %s » → %s', (mdp, attendu) => {
    expect(niveau(mdp)).toBe(attendu)
  })

  it('ne récompense pas « un mot + chiffres + symbole » comme une phrase de passe', () => {
    expect(niveau('Chocolatine1')).not.toBe('solide')
    expect(niveau('Chocolatine1')).not.toBe('tres-solide')
    expect(niveau('Chocolatine2024!')).not.toBe('tres-solide')
  })

  it('ne coche « plusieurs mots » qu’avec au moins 3 mots différents', () => {
    const conseil = (mdp: string) => evaluerRobustesse(mdp).conseils.find((c) => c.id === 'mots')?.ok
    expect(conseil('girafe-girafe-girafe-girafe')).toBe(false)
    expect(conseil('girafe-girafe-violette')).toBe(false)
    expect(conseil('girafe-violette-pluie')).toBe(true)
  })

  it('un seul mot (toutes classes, jusqu’à 40 caractères) n’atteint jamais « très solide »', () => {
    const alphabet = [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?#$%&*+=@éèàç']
    let graine = 42
    const hasard = (n: number) => {
      graine = (Math.imul(graine, 1103515245) + 12345) >>> 0
      return (graine >>> 8) % n
    }
    for (let essai = 0; essai < 2000; essai++) {
      const longueur = 1 + hasard(40)
      let mot = ''
      for (let i = 0; i < longueur; i++) mot += alphabet[hasard(alphabet.length)]
      expect(niveau(mot), mot).not.toBe('tres-solide')
    }
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
