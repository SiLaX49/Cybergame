import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Fil } from '@/content/schema'
import FilStep from '@/mission/FilStep.vue'
import { creerStore, definirStore } from '@/store/useProgress'
import { rappelFixture } from './fixtures'
import { bouton, cliquer } from './helpers'
import { MemoryStorage } from './memory-storage'

beforeEach(() => definirStore(creerStore(new MemoryStorage())))
const fil = () => rappelFixture().etapes[0] as Fil

describe('FilStep', () => {
  it('chaque notification se déplie, reçoit une action, puis on valide', async () => {
    const w = mount(FilStep, { props: { fil: fil() }, attachTo: document.body })
    expect(w.find('figure').attributes('data-app')).toBe('verrouillage')
    expect(w.findAll('[data-notif]')).toHaveLength(3)
    expect(w.html()).not.toContain('surprise')
    expect(w.text()).toContain('Notifications traitées : 0 sur 3')
    expect(bouton(w, 'Valider mes choix').attributes('disabled')).toBeDefined()

    const n1 = w.find('[data-notif="n1"]')
    await n1.trigger('click')
    expect(n1.attributes('aria-expanded')).toBe('true')
    await cliquer(w, 'J’ignore')
    expect(n1.attributes('aria-expanded')).toBe('false')
    expect(n1.text()).toContain('Ignorée')
    expect(document.activeElement).toBe(n1.element)

    for (const [n, action] of [['n2', 'Je vérifie autrement'], ['n3', 'J’ouvre / je clique']] as const) {
      await w.find(`[data-notif="${n}"]`).trigger('click')
      await cliquer(w, action)
    }
    expect(w.text()).toContain('Notifications traitées : 3 sur 3')
    await cliquer(w, 'Valider mes choix')
    expect(w.emitted('evenement')).toEqual([[{ type: 'fil-termine', actions: { n1: 'ignorer', n2: 'verifier', n3: 'ouvrir' } }]])
    w.unmount()
  })

  it('une seule notification ouverte à la fois', async () => {
    const w = mount(FilStep, { props: { fil: fil() } })
    await w.find('[data-notif="n1"]').trigger('click')
    await w.find('[data-notif="n2"]').trigger('click')
    expect(w.find('[data-notif="n1"]').attributes('aria-expanded')).toBe('false')
    expect(w.find('[data-notif="n2"]').attributes('aria-expanded')).toBe('true')
    expect(w.findAll('.actions-notif')).toHaveLength(1)
  })
})
