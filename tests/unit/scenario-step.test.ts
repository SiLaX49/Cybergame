import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Scenario } from '@/content/schema'
import type { ScenarioResultat } from '@/engine/mission-runner'
import { ordreAffichage } from '@/engine/ordre'
import ScenarioStep from '@/mission/ScenarioStep.vue'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import { leviersFixture, missionFixture } from './fixtures'
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
  choixId: 'verif',
  qualite: 'bon',
  levier: null,
  recuperationFaite: null,
  passe: false,
  indiceUtilise: false,
}
const monter = (props: Record<string, unknown> = {}) =>
  mount(ScenarioStep, {
    props: { scenario: scenario(), phase: 'situation', mode: 'solo', sensible: false, leviers: leviersFixture(), ...props },
  })

describe('ScenarioStep', () => {
  it('situation (solo) : un clic sur un choix l’envoie', async () => {
    const w = monter()
    expect(w.find('h2').text()).toBe('Que fais-tu ?')
    await w.find('[data-choix="aide"]').trigger('click')
    expect(w.emitted('evenement')).toEqual([[{ type: 'choisir', choixId: 'aide' }]])
  })

  it('les choix s’affichent dans l’ordre mélangé propre au scénario', () => {
    const s = scenario()
    const w = monter()
    expect(w.findAll('[data-choix]').map((b) => b.attributes('data-choix'))).toEqual(ordreAffichage(s.choix, s.id).map((c) => c.id))
  })

  it('binôme : invite à discuter', () => {
    expect(monter({ mode: 'binome' }).text()).toContain('Discutez à deux, puis choisissez en bas du téléphone.')
  })

  it('classe : le choix doit être validé par l’adulte', async () => {
    const w = monter({ mode: 'classe' })
    await w.find('[data-choix="verif"]').trigger('click')
    expect(w.emitted('evenement')).toBeUndefined()
    expect(w.find('[data-choix="verif"]').attributes('aria-pressed')).toBe('true')
    await cliquer(w, 'Valider le choix de la classe')
    expect(w.emitted('evenement')).toEqual([[{ type: 'choisir', choixId: 'verif' }]])
  })

  it('après le choix, le téléphone joue le geste et le panneau passe à la suite', () => {
    const w = monter({ phase: 'consequence', choixId: 'clic', resultat: { ...resultatClic, choixId: 'clic', qualite: 'risque' } })
    expect(w.find('.choix-joue').text()).toContain('Lien ouvert')
    expect(w.find('[data-choix]').exists()).toBe(false)
    expect(w.find('h2').text()).toBe('Et alors, que se passe-t-il ?')
  })

  it('conséquence : verdict, vrais indices seulement, à retenir, continuer ou rejouer', async () => {
    const w = monter({ phase: 'consequence', resultat: resultatClic })
    expect(w.text()).toContain('Bon réflexe !')
    expect(w.text()).toContain('Aucun colis en attente.')
    expect(w.findAll('.liste-indices li').map((li) => li.text()).sort()).toEqual(['L’adresse est bizarre', 'On me presse'])
    expect(w.text()).not.toContain('Le montant est petit')
    expect(w.text()).not.toContain('tu l’avais coché')
    expect(w.text()).toContain('Un transporteur ne demande pas de payer par SMS.')
    await cliquer(w, 'Rejouer ce scénario')
    await cliquer(w, 'Continuer')
    expect(w.emitted('evenement')).toEqual([[{ type: 'rejouer' }], [{ type: 'continuer' }]])
  })

  it('lecture simplifiée activée pendant la conséquence : le texte change, la phase reste', async () => {
    const w = monter({ phase: 'consequence', resultat: resultatClic })
    store.modifierReglages({ lectureSimple: true })
    await w.vm.$nextTick()
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

  it.each([
    ['sms', 'Situation : message de Colis Express dans Messages'],
    ['chat', 'Situation : message de Colis Express dans Messages'],
    ['social', 'Situation : message de Colis Express dans Messages'],
    ['mail', 'Situation : mail de Colis Express'],
    ['web', 'Situation : page Colis Express'],
  ] as const)('nom accessible de la situation adapté à l’écran %s', (app, attendu) => {
    const s = scenario()
    const w = monter({ scenario: { ...s, ecran: { ...s.ecran, app } } })
    expect(w.find('article.scenario').attributes('aria-label')).toBe(attendu)
  })

  it('lecture simplifiée : la conséquence du choix risqué est simplifiée', () => {
    store.modifierReglages({ lectureSimple: true })
    const w = monter({
      phase: 'consequence',
      resultat: { ...resultatClic, choixId: 'clic', qualite: 'risque', levier: 'urgence' },
    })
    expect(w.text()).toContain('On vole la carte.')
    expect(w.text()).not.toContain('La carte est volée.')
  })

  it('annonce le rôle joué', () => {
    const w = monter({ scenario: { ...scenario(), role: 'temoin' } })
    expect(w.text()).toContain('Dans ce scénario, tu joues un·e témoin.')
  })
})
