import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MotDePasseGame from '@/minigames/MotDePasseGame.vue'
import { motdepasseFixture } from './fixtures'

describe('refonte des mini-jeux', () => {
  it('la jauge du mot de passe est une barre native avec libellé et niveau en texte', () => {
    const w = mount(MotDePasseGame, { props: { config: motdepasseFixture() } })
    const jauge = w.find('progress.jauge')
    expect(jauge.exists()).toBe(true)
    const id = jauge.attributes('id')
    expect(w.find(`label[for="${id}"]`).text().length).toBeGreaterThan(0)
    expect(w.find('.jauge-niveau').text().length).toBeGreaterThan(0)
    // Le niveau est déjà annoncé par #robustesse-mdp (role=status) : la jauge reste visuelle.
    expect(w.find('.jauge-bloc').attributes('aria-hidden')).toBe('true')
    expect(w.find('#robustesse-mdp').attributes('role')).toBe('status')
  })
})
