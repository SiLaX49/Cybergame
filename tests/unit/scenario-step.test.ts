import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Scenario } from '@/content/schema'
import type { ScenarioResultat } from '@/engine/mission-runner'
import ScenarioStep from '@/mission/ScenarioStep.vue'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import { missionFixture } from './fixtures'
import { bouton, cliquer } from './helpers'
import { MemoryStorage } from './memory-storage'

let store: ProgressStore
beforeEach(() => {
  store = creerStore(new MemoryStorage())
  definirStore(store)
})

const scenario = () => missionFixture().etapes[0] as Scenario
const resultatClic: ScenarioResultat = {
  type: 'scenario',
  choixId: 'clic',
  qualite: 'risque',
  indicesChoisis: ['url'],
  indicesJustes: 1,
  indicesFaux: 0,
  recuperationFaite: null,
  passe: false,
}
const monter = (props: Record<string, unknown> = {}) =>
  mount(ScenarioStep, { props: { scenario: scenario(), phase: 'situation', mode: 'solo', sensible: false, ...props } })

describe('ScenarioStep', () => {
  it('situation (solo) : un clic sur un choix l’envoie', async () => {
    const w = monter()
    expect(w.find('h2').text()).toBe('Que fais-tu ?')
    await w.find('[data-choix="aide"]').trigger('click')
    expect(w.emitted('evenement')).toEqual([[{ type: 'choisir', choixId: 'aide' }]])
  })

  it('binôme : invite à discuter', () => {
    expect(monter({ mode: 'binome' }).text()).toContain('Discutez à deux avant de choisir')
  })

  it('classe : le choix doit être validé par l’adulte', async () => {
    const w = monter({ mode: 'classe' })
    await w.find('[data-choix="verif"]').trigger('click')
    expect(w.emitted('evenement')).toBeUndefined()
    expect(w.find('[data-choix="verif"]').attributes('aria-pressed')).toBe('true')
    await cliquer(w, 'Valider le choix de la classe')
    expect(w.emitted('evenement')).toEqual([[{ type: 'choisir', choixId: 'verif' }]])
  })

  it('indices : « Je ne sais pas » ou sélection', async () => {
    const w = monter({ phase: 'indices' })
    expect(bouton(w, 'Valider').attributes('disabled')).toBeDefined()
    await cliquer(w, 'Je ne sais pas')
    await w.find('input[value="url"]').setValue(true)
    await w.find('form').trigger('submit')
    expect(w.emitted('evenement')).toEqual([
      [{ type: 'valider-indices', indices: [] }],
      [{ type: 'valider-indices', indices: ['url'] }],
    ])
  })

  it('conséquence : verdict, indices, à retenir, continuer ou rejouer', async () => {
    const w = monter({ phase: 'consequence', resultat: resultatClic })
    expect(w.text()).toContain('C’était risqué')
    expect(w.text()).toContain('La carte est volée.')
    expect(w.text()).toContain('tu l’avais coché')
    expect(w.text()).toContain('Un transporteur ne demande pas de payer par SMS.')
    await cliquer(w, 'Rejouer ce scénario')
    await cliquer(w, 'Continuer')
    expect(w.emitted('evenement')).toEqual([[{ type: 'rejouer' }], [{ type: 'continuer' }]])
  })

  it('lecture simplifiée activée pendant la conséquence : le texte change, la phase reste', async () => {
    const w = monter({ phase: 'consequence', resultat: resultatClic })
    store.modifierReglages({ lectureSimple: true })
    await w.vm.$nextTick()
    expect(w.text()).toContain('On vole la carte.')
    expect(w.text()).toContain('Ne paie jamais un colis par SMS.')
    expect(bouton(w, 'Continuer').exists()).toBe(true)
  })

  it('récupération : affiche l’action prévue et signale quand elle est faite', async () => {
    const w = monter({ phase: 'recuperation', resultat: resultatClic })
    expect(w.text()).toContain('Bloque et signale ce compte')
    await cliquer(w, 'Menu du contact')
    await cliquer(w, 'Bloquer')
    await w.find('input[value="Arnaque ou fraude"]').setValue()
    await cliquer(w, 'Envoyer le signalement')
    await cliquer(w, 'Continuer')
    expect(w.emitted('evenement')).toEqual([[{ type: 'recuperation-faite' }]])
  })

  it('thème sensible : bouton « Passer ce scénario »', async () => {
    expect(monter().text()).not.toContain('Passer ce scénario')
    const w = monter({ sensible: true })
    await cliquer(w, 'Passer ce scénario')
    expect(w.emitted('evenement')).toEqual([[{ type: 'passer' }]])
  })

  it('annonce le rôle joué', () => {
    const w = monter({ scenario: { ...scenario(), role: 'temoin' } })
    expect(w.text()).toContain('Dans ce scénario, tu joues un·e témoin.')
  })
})
