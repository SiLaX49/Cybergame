import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ExplicationPanel from '@/mission/ExplicationPanel.vue'

describe('ExplicationPanel : « Ce qui devait t’alerter »', () => {
  it('ne recite pas un passage déjà écrit dans l’intitulé de l’indice', () => {
    const w = mount(ExplicationPanel, {
      props: {
        explication: 'Explication.',
        indices: [
          { id: 'urgence', libelle: 'On me presse : « sous 24 h »', passage: 'sous 24 h' },
          { id: 'numero', libelle: 'Le SMS vient d’un numéro inconnu', passage: '+33 6 39 98 12 48' },
        ],
      },
    })
    const [urgence, numero] = w.findAll('.liste-indices li')
    expect(urgence!.find('.cite').exists()).toBe(false)
    expect(urgence!.text().match(/sous 24 h/g)).toHaveLength(1)
    expect(numero!.find('.cite').text()).toBe('« +33 6 39 98 12 48 »')
  })
})
