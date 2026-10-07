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
  indicesChoisis: ['url'],
  indicesJustes: 1,
  indicesFaux: 0,
  levier: null,
  recuperationFaite: null,
  passe: false,
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

  it('choix et indices s’affichent dans l’ordre mélangé propre au scénario', async () => {
    const s = scenario()
    const w = monter()
    expect(w.findAll('[data-choix]').map((b) => b.attributes('data-choix'))).toEqual(ordreAffichage(s.choix, s.id).map((c) => c.id))
    await w.setProps({ phase: 'indices' })
    expect(w.findAll('input[type="checkbox"]').map((i) => i.attributes('value'))).toEqual(
      ordreAffichage(s.indices, s.id).map((i) => i.id),
    )
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
    expect(w.text()).toContain('Bon réflexe !')
    expect(w.text()).toContain('Aucun colis en attente.')
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
      resultat: { ...resultatClic, choixId: 'clic', qualite: 'risque', indicesChoisis: [], indicesJustes: 0, levier: 'urgence' },
    })
    expect(w.text()).toContain('On vole la carte.')
    expect(w.text()).not.toContain('La carte est volée.')
  })

  it('récupération : « Maintenant, protège-toi » quand on joue la personne visée, sinon titre inchangé', () => {
    const titre = (role: Scenario['role']) =>
      monter({ scenario: { ...scenario(), role }, phase: 'recuperation', resultat: resultatClic }).find('h2').text()
    expect(titre('victime')).toBe('Maintenant, protège-toi')
    expect(titre('temoin')).toBe('Maintenant, limite les dégâts')
    expect(titre('auteur')).toBe('Maintenant, limite les dégâts')
    expect(titre(null)).toBe('Maintenant, limite les dégâts')
  })

  it('récupération « soutenir » : textes adaptés au contexte de la mission', () => {
    const s = { ...scenario(), role: 'temoin' as const, recuperation: { action: 'soutenir' as const, siChoix: ['clic'] } }
    const rencontres = monter({ scenario: s, phase: 'recuperation', resultat: resultatClic, sensible: true, contexte: 'rencontres' })
    expect(rencontres.text()).toContain('Promis, je ne dirai rien.')
    expect(rencontres.text()).not.toContain('ils sont bêtes')
    const harcelement = monter({ scenario: s, phase: 'recuperation', resultat: resultatClic, sensible: true, contexte: 'harcelement' })
    expect(harcelement.text()).toContain('Laisse tomber, ils sont bêtes.')
  })

  it('récupération « bloquer-signaler » hors thème sensible : aucun attribut ajouté', () => {
    const w = monter({ phase: 'recuperation', resultat: resultatClic })
    expect(w.find('section.recuperation').attributes('contexte')).toBeUndefined()
  })

  it('annonce le rôle joué', () => {
    const w = monter({ scenario: { ...scenario(), role: 'temoin' } })
    expect(w.text()).toContain('Dans ce scénario, tu joues un·e témoin.')
  })
})
