import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { lieuSchema, scenarioSchema } from '@/content/schema'
import type { LieuResultat, ScenarioResultat } from '@/engine/mission-runner'
import ConsequencePanel from '@/mission/ConsequencePanel.vue'
import ReactionPanel from '@/mission/ReactionPanel.vue'
import { leviersFixture, rawLieu, rawScenario } from './fixtures'

const scenario = scenarioSchema.parse(rawScenario())
const lieu = lieuSchema.parse(rawLieu())
const resScenario: ScenarioResultat = {
  type: 'scenario', choixId: 'clic', qualite: 'risque', indiceUtilise: false,
  levier: null, recuperationFaite: null, passe: false,
}
const resLieu: LieuResultat = { type: 'lieu', choixId: 'donne', qualite: 'risque', levier: null, recuperationFaite: null, essais: [], passe: false }

describe('verdict « risque » : encadré doux en thème sensible', () => {
  it.each([
    ['ConsequencePanel', (sensible: boolean) => mount(ConsequencePanel, { props: { scenario, resultat: resScenario, leviers: leviersFixture(), indices: scenario.indices, sensible } })],
    ['ReactionPanel', (sensible: boolean) => mount(ReactionPanel, { props: { lieu, resultat: resLieu, leviers: leviersFixture(), sensible } })],
  ])('%s', (_nom, monter) => {
    const normal = monter(false).find('.verdict')
    expect(normal.classes()).toContain('encadre-risque')
    const sensible = monter(true).find('.verdict')
    expect(sensible.classes()).toContain('encadre-doux')
    expect(sensible.classes()).not.toContain('encadre-risque')
    // L'icône et le texte du verdict restent.
    expect(sensible.text()).toBe(normal.text())
  })
})
