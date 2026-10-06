import { describe, expect, it } from 'vitest'
import { GESTES } from '@/content/schema'
import { initiales, teinte } from '@/phone/avatar'
import { GESTES_TELEPHONE, gesteDuChoix } from '@/phone/gestes'
import { decouperLiens, decouperUrl } from '@/phone/liens'

const texte = (t: string) => ({ type: 'texte', texte: t })
const lien = (t: string) => ({ type: 'lien', texte: t })

describe('decouperLiens', () => {
  it('repère un domaine avec son chemin, sans la ponctuation finale', () => {
    expect(decouperLiens('Paie ici : colis-xp.net/payer.')).toEqual([texte('Paie ici : '), lien('colis-xp.net/payer'), texte('.')])
  })
  it('repère plusieurs liens, avec ou sans https', () => {
    expect(decouperLiens('https://snaptalk-vote.xyz et clipforge-full-crack.zip !')).toEqual([
      lien('https://snaptalk-vote.xyz'), texte(' et '), lien('clipforge-full-crack.zip'), texte(' !'),
    ])
  })
  it('ignore les adresses mail', () => {
    const t = 'Écris à support@moncollege-ent.net ou prenom.nom@ecole.fr'
    expect(decouperLiens(t)).toEqual([texte(t)])
  })
  it('ignore les points ordinaires et les majuscules', () => {
    for (const t of ['Payez 1,99 € avant 18 h. Merci M. Durand.', 'Ok.Je pars', 'n°FR4471 · 3e A']) {
      expect(decouperLiens(t), t).toEqual([texte(t)])
    }
  })
  it('texte vide', () => expect(decouperLiens('')).toEqual([]))
})

describe('decouperUrl', () => {
  it('sépare domaine et chemin, et repère le http', () => {
    expect(decouperUrl('http://gare-wifi.com/connexion')).toEqual({ nonSecurise: true, domaine: 'gare-wifi.com', reste: '/connexion' })
    expect(decouperUrl('https://gare-libre-wifi.com')).toEqual({ nonSecurise: false, domaine: 'gare-libre-wifi.com', reste: '' })
    expect(decouperUrl('colis-xp.net/payer?id=4')).toEqual({ nonSecurise: false, domaine: 'colis-xp.net', reste: '/payer?id=4' })
  })
})

describe('avatar', () => {
  it('initiales des deux premiers mots qui commencent par une lettre', () => {
    expect(initiales('Mon Collège')).toBe('MC')
    expect(initiales('Inès')).toBe('IN')
    expect(initiales('Tom (3e A)')).toBe('TA')
    expect(initiales('drole_de_college_42')).toBe('DD')
  })
  it('aucune initiale pour un numéro de téléphone', () => expect(initiales('+33 6 39 98 12 48')).toBe(''))
  it('teinte stable entre 0 et 359', () => {
    expect(teinte('Léa')).toBe(teinte('Léa'))
    expect(teinte('Léa')).toBeGreaterThanOrEqual(0)
    expect(teinte('Léa')).toBeLessThan(360)
  })
})

describe('gestes', () => {
  it('chaque geste a une icône et une bannière', () => {
    for (const g of GESTES) {
      expect(GESTES_TELEPHONE[g].icone, g).toBeTruthy()
      expect(GESTES_TELEPHONE[g].banniere, g).not.toBe('')
    }
  })
  it('le choix « aide » demande de l’aide par défaut', () => {
    expect(gesteDuChoix({ qualite: 'aide' })).toBe('demander-aide')
    expect(gesteDuChoix({ qualite: 'bon', geste: 'bloquer' })).toBe('bloquer')
  })
})
