import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PermissionsGame from '@/minigames/PermissionsGame.vue'
import { permissionsFixture } from './fixtures'
import { bouton, cliquer } from './helpers'

const monter = () => mount(PermissionsGame, { props: { config: permissionsFixture() } })
const decider = async (w: ReturnType<typeof monter>, nom: string, valeur: 'autoriser' | 'refuser') =>
  w.find(`input[name="${nom}"][value="${valeur}"]`).setValue()

describe('PermissionsGame', () => {
  it('« Valider » attend une décision pour chaque permission', async () => {
    const w = monter()
    expect(w.text()).toContain('Appli 1 sur 2 : Super Lampe')
    expect(bouton(w, 'Valider les permissions').attributes('disabled')).toBeDefined()
    await decider(w, 'perm-lampe-flash', 'autoriser')
    expect(bouton(w, 'Valider les permissions').attributes('disabled')).toBeDefined()
    await decider(w, 'perm-lampe-contacts', 'refuser')
    expect(bouton(w, 'Valider les permissions').attributes('disabled')).toBeUndefined()
  })

  it('explique chaque décision et compte sur toutes les applis', async () => {
    const w = monter()
    await decider(w, 'perm-lampe-flash', 'autoriser')
    await decider(w, 'perm-lampe-contacts', 'autoriser')
    await cliquer(w, 'Valider les permissions')
    expect(w.text()).toContain('À refuser : Une lampe n’a aucune raison de lire tes contacts.')
    await cliquer(w, 'Appli suivante')
    expect(w.text()).toContain('Appli 2 sur 2 : Mon Trajet')
    expect(w.find('input[name="perm-carte-position"][value="autoriser"]').element).toHaveProperty('checked', false)
    expect(bouton(w, 'Valider les permissions').attributes('disabled')).toBeDefined()
    await decider(w, 'perm-carte-position', 'autoriser')
    await decider(w, 'perm-carte-micro', 'refuser')
    await cliquer(w, 'Valider les permissions')
    await cliquer(w, 'Terminer le mini-jeu')
    expect(w.emitted('termine')).toEqual([[{ reussites: 3, erreurs: 1 }]])
  })

  it('le bilan compte les décisions justes de l’appli et précède les explications', async () => {
    const w = monter()
    await decider(w, 'perm-lampe-flash', 'autoriser')
    await decider(w, 'perm-lampe-contacts', 'autoriser')
    await cliquer(w, 'Valider les permissions')
    const bilan = w.find('.bilan')
    expect(bilan.text()).toBe('1 décision juste sur 2. Les explications sont sous chaque permission.')
    expect(bilan.attributes('role')).toBeUndefined()
    expect(bilan.attributes('tabindex')).toBe('-1')
    const explication = w.find('.verdict').element
    expect(bilan.element.compareDocumentPosition(explication) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(w.find('[role="status"]').exists()).toBe(false)
    await cliquer(w, 'Appli suivante')
    await decider(w, 'perm-carte-position', 'autoriser')
    await decider(w, 'perm-carte-micro', 'refuser')
    await cliquer(w, 'Valider les permissions')
    expect(w.find('.bilan').text()).toBe('2 décisions justes sur 2. Les explications sont sous chaque permission.')
  })

  it('le focus va au bilan après « Valider », puis au titre de la nouvelle appli', async () => {
    const w = mount(PermissionsGame, { props: { config: permissionsFixture() }, attachTo: document.body })
    await decider(w, 'perm-lampe-flash', 'autoriser')
    await decider(w, 'perm-lampe-contacts', 'refuser')
    await cliquer(w, 'Valider les permissions')
    await flushPromises()
    expect(document.activeElement).toBe(w.find('.bilan').element)
    await cliquer(w, 'Appli suivante')
    await flushPromises()
    expect(document.activeElement?.textContent).toBe('Appli 2 sur 2 : Mon Trajet')
    w.unmount()
  })
})
