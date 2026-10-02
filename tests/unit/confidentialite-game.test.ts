import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ConfidentialiteGame from '@/minigames/ConfidentialiteGame.vue'
import { confidentialiteFixture } from './fixtures'
import { cliquer } from './helpers'

const monter = () => mount(ConfidentialiteGame, { props: { config: confidentialiteFixture() } })

describe('ConfidentialiteGame', () => {
  it('part des réglages initiaux', () => {
    const w = monter()
    expect(w.text()).toContain('Paramètres · SnapTalk')
    expect((w.find('input[name="reglage-profil"][value="tous"]').element as HTMLInputElement).checked).toBe(true)
  })

  it('un profil bien réglé : tout est juste', async () => {
    const w = monter()
    await w.find('input[name="reglage-profil"][value="amis"]').setValue()
    await w.find('input[name="reglage-position"][value="non"]').setValue()
    await cliquer(w, 'Vérifier mon profil')
    expect(w.find('.bilan').text()).toContain('3 réglages sur 3 sont sûrs')
    expect(w.find('input[name="reglage-profil"][value="tous"]').attributes('disabled')).toBeDefined()
    await cliquer(w, 'Terminer le mini-jeu')
    expect(w.emitted('termine')).toEqual([[{ reussites: 3, erreurs: 0 }]])
  })

  it('vérifier sans rien changer : les réglages à revoir sont expliqués', async () => {
    const w = monter()
    await cliquer(w, 'Vérifier mon profil')
    expect(w.find('.bilan').text()).toContain('1 réglage sur 3 est sûr')
    expect(w.text()).toContain('À revoir : choisis « Mes amis »')
    expect(w.text()).toContain('Un profil public est visible par des inconnus.')
    await cliquer(w, 'Terminer le mini-jeu')
    expect(w.emitted('termine')).toEqual([[{ reussites: 1, erreurs: 2 }]])
  })

  it('le bilan précède les explications et n’est pas une région annoncée', async () => {
    const w = monter()
    await cliquer(w, 'Vérifier mon profil')
    const bilan = w.find('.bilan')
    expect(bilan.text()).toContain('Les explications sont sous chaque réglage.')
    expect(bilan.attributes('role')).toBeUndefined()
    expect(bilan.attributes('tabindex')).toBe('-1')
    const explication = w.find('.verdict').element
    expect(bilan.element.compareDocumentPosition(explication) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(w.find('[role="status"]').exists()).toBe(false)
  })
})
