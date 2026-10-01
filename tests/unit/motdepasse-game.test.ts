import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MotDePasseGame from '@/minigames/MotDePasseGame.vue'
import { motdepasseFixture } from './fixtures'
import { bouton, cliquer } from './helpers'

const monter = (surcharge = {}) => mount(MotDePasseGame, { props: { config: { ...motdepasseFixture(), ...surcharge } } })

describe('MotDePasseGame', () => {
  it('affiche le contexte, l’avertissement et l’objectif', () => {
    const w = monter()
    expect(w.text()).toContain('Ton pseudo est Léa2012.')
    expect(w.text()).toContain('N’écris pas ton vrai mot de passe')
    expect(w.text()).toContain('Objectif : un mot de passe solide')
    expect(bouton(w, 'Valider mon mot de passe').attributes('disabled')).toBeDefined()
  })

  it('suit la robustesse et valide quand l’objectif est atteint', async () => {
    const w = monter()
    await w.find('input#phrase-de-passe').setValue('chat')
    expect(w.find('[role="status"]').text()).toContain('Très faible')
    await w.find('input#phrase-de-passe').setValue('chat-bleu-mange')
    expect(w.find('[role="status"]').text()).toContain('Solide')
    await cliquer(w, 'Valider mon mot de passe')
    expect(w.emitted('termine')).toEqual([[{ reussites: 1, erreurs: 0 }]])
  })

  it('objectif « très solide » : une phrase courte ne suffit pas', async () => {
    const w = monter({ objectif: 'tres-solide' })
    await w.find('input#phrase-de-passe').setValue('chat-bleu-mange')
    expect(bouton(w, 'Valider mon mot de passe').attributes('disabled')).toBeDefined()
    await w.find('input#phrase-de-passe').setValue('chat-bleu-mange-pizza')
    expect(bouton(w, 'Valider mon mot de passe').attributes('disabled')).toBeUndefined()
  })

  it('signale un mot interdit', async () => {
    const w = monter()
    await w.find('input#phrase-de-passe').setValue('lea-mange-une-pizza')
    expect(w.text()).toContain('Pas de prénom, de pseudo ni de date (à faire)')
  })

  it('« Je passe » montre un exemple puis permet de terminer', async () => {
    const w = monter()
    await cliquer(w, 'Je passe')
    expect(w.text()).toContain('girafe-violette-sous-la-pluie')
    await cliquer(w, 'Terminer le mini-jeu')
    expect(w.emitted('termine')).toEqual([[{ reussites: 0, erreurs: 1 }]])
  })
})
