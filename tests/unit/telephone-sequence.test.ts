import { describe, expect, it } from 'vitest'
import { decouperLiens } from '@/phone/liens'
import { atteinte, planSequence } from '@/phone/sequence'
import { decouperTexte } from '@/phone/surlignage'

const texte = (t: string) => ({ type: 'texte', texte: t })
const lien = (t: string) => ({ type: 'lien', texte: t })
const passage = (t: string, numero: number | null) => ({ type: 'passage', texte: t, numero })

describe('planSequence', () => {
  it('avec réaction : envoi, écrit, réaction, verdict, indices, fin', () => {
    expect(planSequence({ reaction: true, instantane: false })).toEqual([
      { etape: 'envoi', a: 0 }, { etape: 'ecrit', a: 150 }, { etape: 'reaction', a: 900 },
      { etape: 'verdict', a: 1000 }, { etape: 'indices', a: 1400 }, { etape: 'fin', a: 1800 },
    ])
  })
  it('sans réaction : envoi, verdict, indices, fin', () => {
    expect(planSequence({ reaction: false, instantane: false })).toEqual([
      { etape: 'envoi', a: 0 }, { etape: 'verdict', a: 600 }, { etape: 'indices', a: 1000 }, { etape: 'fin', a: 1400 },
    ])
  })
  it('instantané : tout d’un coup', () => {
    expect(planSequence({ reaction: true, instantane: true })).toEqual([{ etape: 'fin', a: 0 }])
    expect(planSequence({ reaction: false, instantane: true })).toEqual([{ etape: 'fin', a: 0 }])
  })
  it('atteinte : étape atteinte ou dépassée', () => {
    expect(atteinte('verdict', 'verdict')).toBe(true)
    expect(atteinte('fin', 'envoi')).toBe(true)
    expect(atteinte('envoi', 'verdict')).toBe(false)
    expect(atteinte('attente', 'envoi')).toBe(false)
  })
})

describe('decouperTexte', () => {
  it('sans passage : identique à decouperLiens', () => {
    const t = 'Paie ici : colis-xp.net/payer.'
    expect(decouperTexte(t, [])).toEqual(decouperLiens(t))
  })
  it('un passage au milieu', () => {
    expect(decouperTexte('Ton compte sera supprimé ce soir, vite !', [{ texte: 'supprimé ce soir', numero: 1 }])).toEqual([
      texte('Ton compte sera '), passage('supprimé ce soir', 1), texte(', vite !'),
    ])
  })
  it('deux passages donnés dans l’ordre inverse du texte', () => {
    expect(decouperTexte('Urgent : paie 2 € maintenant', [{ texte: 'maintenant', numero: 2 }, { texte: 'Urgent', numero: 1 }])).toEqual([
      passage('Urgent', 1), texte(' : paie 2 € '), passage('maintenant', 2),
    ])
  })
  it('passage introuvable ignoré', () => {
    expect(decouperTexte('Bonjour Léa', [{ texte: 'absent', numero: 1 }])).toEqual([texte('Bonjour Léa')])
  })
  it('un passage qui contient un domaine reste un seul morceau', () => {
    expect(decouperTexte('Clique sur colis-xp.net/payer vite', [{ texte: 'sur colis-xp.net/payer', numero: null }])).toEqual([
      texte('Clique '), passage('sur colis-xp.net/payer', null), texte(' vite'),
    ])
  })
  it('un lien hors passage est toujours repéré', () => {
    expect(decouperTexte('Dernier rappel : va sur colis-xp.net', [{ texte: 'Dernier rappel', numero: 1 }])).toEqual([
      passage('Dernier rappel', 1), texte(' : va sur '), lien('colis-xp.net'),
    ])
  })
  it('chevauchement : le premier trouvé dans le texte gagne', () => {
    expect(decouperTexte('Gagne un iPhone gratuit', [{ texte: 'iPhone gratuit', numero: 2 }, { texte: 'Gagne un iPhone', numero: 1 }])).toEqual([
      passage('Gagne un iPhone', 1), texte(' gratuit'),
    ])
  })
  it('première occurrence seulement', () => {
    expect(decouperTexte('vite, vite', [{ texte: 'vite', numero: 1 }])).toEqual([passage('vite', 1), texte(', vite')])
  })
  it('rien de perdu : la concaténation redonne le texte', () => {
    const t = 'Urgent : ton colis attend sur colis-xp.net/payer, paie 1,99 € avant ce soir.'
    const morceaux = decouperTexte(t, [{ texte: 'ce soir', numero: 2 }, { texte: 'Urgent', numero: 1 }, { texte: 'colis attend sur', numero: 3 }])
    expect(morceaux.map((m) => m.texte).join('')).toBe(t)
  })
})
