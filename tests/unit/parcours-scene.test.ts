import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { DECORS } from '@/content/schema'
import { DECORS_EMOJI } from '@/parcours/decors'
import { ILES, ILES_INFO, estIle } from '@/parcours/iles'
import ParcoursScene from '@/parcours/ParcoursScene.vue'

const etapes = ['📚', '🏀', '🚉', '🌳', '🛋️'].map((emoji, i) => ({ id: `l${i}`, nom: `Lieu ${i + 1}`, emoji }))
const monter = (position: number) => mount(ParcoursScene, { props: { ile: 'comptes', etapes, position, personnage: 'p3' } })

describe('ParcoursScene', () => {
  it('chaque île a son objet, et estIle reconnaît les six thèmes', () => {
    for (const id of ILES) expect(ILES_INFO[id].objet.nom, id).toBeTruthy()
    expect(estIle('comptes')).toBe(true)
    expect(estIle('cour')).toBe(false)
  })

  it('chaque décor a son dessin', () => {
    for (const d of DECORS) expect(DECORS_EMOJI[d], d).toBeTruthy()
  })

  it.each([4, 6])('place %i plateformes plus l’arrivée', (n) => {
    const e = Array.from({ length: n }, (_, i) => ({ id: `e${i}`, nom: `Lieu ${i + 1}`, emoji: '📚' }))
    const w = mount(ParcoursScene, { props: { ile: 'comptes', etapes: e, position: 0, personnage: 'p1' } })
    expect(w.findAll('[data-plateforme]')).toHaveLength(n + 1)
  })

  it('donne la position en texte, le dessin est décoratif', () => {
    const w = monter(1)
    expect(w.find('.position').text()).toBe('Étape 2 sur 5 : Lieu 2')
    expect(w.find('svg').attributes('aria-hidden')).toBe('true')
    expect(w.text()).toContain('Île des clés')
  })

  it('le personnage est sur la plateforme courante, et change de plateforme avec la position', async () => {
    const w = monter(1)
    expect(w.findAll('[data-courante]').map((p) => p.attributes('data-plateforme'))).toEqual(['1'])
    const avant = w.find('.perso').attributes('style')
    await w.setProps({ position: 2 })
    expect(w.find('.perso').attributes('style')).not.toBe(avant)
    expect(w.find('.position').text()).toBe('Étape 3 sur 5 : Lieu 3')
    expect(w.find('[fill="#3b7dd8"]').exists()).toBe(true)
  })

  it('à l’arrivée, l’objet de l’île est gagné', () => {
    const w = monter(5)
    expect(w.find('.position').text()).toContain('Arrivée ! Tu as gagné le coffre-fort')
    expect(w.findAll('[data-courante]').map((p) => p.attributes('data-plateforme'))).toEqual(['5'])
  })
})
