import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { Fil } from '@/content/schema'
import FilStep from '@/mission/FilStep.vue'
import { rappelFixture } from './fixtures'
import { bouton } from './helpers'

const fil = () => rappelFixture().etapes[0] as Fil

describe('FilStep', () => {
  it('exige une action par notification puis les envoie', async () => {
    const w = mount(FilStep, { props: { fil: fil() } })
    expect(w.findAll('fieldset')).toHaveLength(3)
    expect(w.html()).not.toContain('surprise')
    expect(bouton(w, 'Valider mes choix').attributes('disabled')).toBeDefined()
    await w.find('input[name="notif-n1"][value="ignorer"]').setValue()
    await w.find('input[name="notif-n2"][value="verifier"]').setValue()
    expect(bouton(w, 'Valider mes choix').attributes('disabled')).toBeDefined()
    await w.find('input[name="notif-n3"][value="ouvrir"]').setValue()
    await w.find('form').trigger('submit')
    expect(w.emitted('evenement')).toEqual([
      [{ type: 'fil-termine', actions: { n1: 'ignorer', n2: 'verifier', n3: 'ouvrir' } }],
    ])
  })
})
