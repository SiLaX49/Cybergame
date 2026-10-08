import { flushPromises, mount } from '@vue/test-utils'
import bundle from 'virtual:content'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Scenario } from '@/content/schema'
import type { ScenarioResultat } from '@/engine/mission-runner'
import ScenarioStep from '@/mission/ScenarioStep.vue'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import { MemoryStorage } from './memory-storage'

/**
 * Contenu réel : une fois le choix joué, chaque passage d’indice est surligné quelque part dans l’écran (en-tête,
 * média et barre d’adresse compris), avec le numéro que lui donne le panneau, et les numéros se lisent dans l’ordre.
 */
let store: ProgressStore
beforeEach(() => {
  store = creerStore(new MemoryStorage())
  definirStore(store)
})

const scenarios = bundle.missions.flatMap((m) => m.etapes.filter((e): e is Scenario => e.type === 'scenario'))

/** Monte le scénario après le choix, séquence instantanée, sur une phase qui affiche « Ce qui devait t’alerter ». */
async function monterApresChoix(s: Scenario) {
  // Un piège suivi de la question des leviers montre l’explication en phase « pourquoi », sinon en « conséquence ».
  const choix = s.choix.find((c) => !(c.qualite === 'risque' && s.pourquoi)) ?? s.choix[0]!
  const phase = choix.qualite === 'risque' && s.pourquoi ? 'pourquoi' : 'consequence'
  const resultat: ScenarioResultat = {
    type: 'scenario', choixId: choix.id, qualite: choix.qualite, levier: null, recuperationFaite: null, passe: false, indiceUtilise: false,
  }
  const w = mount(ScenarioStep, {
    props: { scenario: s, phase, mode: 'solo', sensible: false, leviers: bundle.leviers, choixId: choix.id, resultat },
  })
  await flushPromises()
  return w
}

describe.each([
  ['lecture normale', false],
  ['lecture simplifiée', true],
])('passages du contenu réel (%s)', (_nom, lectureSimple) => {
  it.each(scenarios.map((s) => [s.id, s] as const))('%s : chaque passage surligné à l’écran, numéros dans l’ordre de lecture', async (_id, s) => {
    store.modifierReglages({ animations: false, lectureSimple })
    const w = await monterApresChoix(s)
    // Panneau : rang = numéro, passage cité entre guillemets.
    const attendus = w.findAll('.liste-indices li').map((li) => `${li.find('.numero').text()} ${li.find('.cite').text().slice(2, -2)}`)
    expect(attendus).toHaveLength(s.indices.length)
    // Téléphone : passages numérotés, dans l’ordre du document (en-tête, puis corps).
    const marques = w.find('figure.telephone').findAll('mark.passage')
    const rendus = marques.map((m) => `${m.find('.numero').text()} ${m.element.lastChild?.textContent}`)
    expect([...new Set(rendus)].sort()).toEqual([...attendus].sort())
    const premiers = [...new Set(marques.map((m) => Number(m.find('.numero').text())))]
    expect(premiers).toEqual(s.indices.map((_i, rang) => rang + 1))
    w.unmount()
  })
})
