import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Scenario } from '@/content/schema'
import PourquoiForm from '@/mission/PourquoiForm.vue'
import type { ScenarioResultat } from '@/engine/mission-runner'
import ScenarioStep from '@/mission/ScenarioStep.vue'
import { reponseLevier } from '@/mission/reponseLevier'
import { creerStore, definirStore } from '@/store/useProgress'
import { leviersFixture, missionFixture } from './fixtures'
import { cliquer } from './helpers'
import { MemoryStorage } from './memory-storage'

beforeEach(() => definirStore(creerStore(new MemoryStorage())))

const scenario = () => missionFixture().etapes[0] as Scenario
const monter = (mode: 'solo' | 'binome' | 'classe' = 'solo') =>
  mount(PourquoiForm, { props: { pourquoi: scenario().pourquoi!, leviers: leviersFixture(), graine: 'sc-1', mode } })

describe('PourquoiForm', () => {
  it('propose les leviers du scénario puis « Autre chose » en dernier', () => {
    const w = monter()
    const boutons = w.findAll('[data-levier]')
    expect(boutons.map((b) => b.attributes('data-levier')).sort()).toEqual(['autre', 'petit-montant', 'reflexe', 'urgence'])
    expect(boutons.at(-1)!.attributes('data-levier')).toBe('autre')
    expect(w.text()).toContain('Beaucoup de gens auraient fait pareil.')
    expect(w.text()).toContain('Il fallait faire vite')
  })

  it('solo : un clic envoie la raison', async () => {
    const w = monter()
    await w.find('[data-levier="urgence"]').trigger('click')
    expect(w.emitted('expliquer')).toEqual([['urgence']])
  })

  it('binôme : invite à en discuter', () => {
    expect(monter('binome').text()).toContain('Discutez à deux')
  })

  it('classe : un clic sélectionne, l’adulte valide', async () => {
    const w = monter('classe')
    await w.find('[data-levier="reflexe"]').trigger('click')
    expect(w.emitted('expliquer')).toBeUndefined()
    expect(w.find('[data-levier="reflexe"]').attributes('aria-pressed')).toBe('true')
    await cliquer(w, 'Valider la raison de la classe')
    expect(w.emitted('expliquer')).toEqual([['reflexe']])
  })
})

describe('ScenarioStep et « pourquoi »', () => {
  const monterEtape = (props: Record<string, unknown>) =>
    mount(ScenarioStep, {
      props: { scenario: scenario(), phase: 'pourquoi', mode: 'solo', sensible: false, leviers: leviersFixture(), ...props },
    })

  it('affiche la question « pourquoi » et émet expliquer', async () => {
    const w = monterEtape({})
    expect(w.find('h2').text()).toBe('Qu’est-ce qui t’a donné envie de le faire ?')
    await w.find('[data-levier="petit-montant"]').trigger('click')
    expect(w.emitted('evenement')).toEqual([[{ type: 'expliquer', levier: 'petit-montant' }]])
  })

  it('la conséquence répond à la raison choisie', () => {
    const w = monterEtape({
      phase: 'consequence',
      resultat: {
        type: 'scenario', choixId: 'clic', qualite: 'risque', indiceUtilise: false,
        levier: 'urgence', recuperationFaite: null, passe: false,
      },
    })
    expect(w.text()).toContain('Ce qui a marché sur toi')
    expect(w.text()).toContain('Tu as répondu : « Il fallait faire vite »')
    expect(w.text()).toContain('Le délai de 24 h est là exprès.')
    expect(w.text()).toContain('Ta parade : Plus on te presse, plus tu ralentis.')
    expect(w.text()).not.toContain('tu l’avais coché')
  })

  it('« Autre chose » reçoit la réponse générique', () => {
    const w = monterEtape({
      phase: 'consequence',
      resultat: {
        type: 'scenario', choixId: 'clic', qualite: 'risque', indiceUtilise: false,
        levier: 'autre', recuperationFaite: null, passe: false,
      },
    })
    expect(w.text()).toContain('Tu as répondu : « Autre chose / je ne sais pas »')
    expect(w.text()).toContain('Truc générique.')
  })
})

describe('« pourquoi » en thème sensible', () => {
  const resultat = (levier: 'autre' | 'urgence'): ScenarioResultat => ({
    type: 'scenario', choixId: 'clic', qualite: 'risque', indiceUtilise: false,
    levier, recuperationFaite: null, passe: false,
  })
  const monterEtape = (sensible: boolean, levier: 'autre' | 'urgence') =>
    mount(ScenarioStep, {
      props: { scenario: scenario(), phase: 'consequence', mode: 'solo', sensible, leviers: leviersFixture(), resultat: resultat(levier) },
    })

  it('« Autre chose » : réponse propre aux thèmes sensibles, titre « Ce qui a pu peser »', () => {
    const w = monterEtape(true, 'autre')
    expect(w.find('.ce-qui-a-marche h3').text()).toBe('Ce qui a pu peser')
    expect(w.text()).not.toContain('Ce qui a marché sur toi')
    expect(w.text()).toContain('Tu as répondu : « Autre chose / je ne sais pas »')
    expect(w.text()).toContain('Truc sensible.')
    expect(w.text()).toContain('Ta parade : Parade sensible.')
    expect(w.text()).not.toContain('Truc générique.')
  })

  it('levier du scénario : même titre neutre en thème sensible', () => {
    const w = monterEtape(true, 'urgence')
    expect(w.find('.ce-qui-a-marche h3').text()).toBe('Ce qui a pu peser')
    expect(w.text()).toContain('Le délai de 24 h est là exprès.')
  })

  it('hors thème sensible : rien ne change', () => {
    const w = monterEtape(false, 'autre')
    expect(w.find('.ce-qui-a-marche h3').text()).toBe('Ce qui a marché sur toi')
    expect(w.text()).toContain('Truc générique.')
  })

  it('reponseLevier : autreSensible seulement en thème sensible', () => {
    const l = leviersFixture()
    expect(reponseLevier(scenario().pourquoi, 'autre', l, true)).toEqual({ libelle: 'Autre chose / je ne sais pas', truc: 'Truc sensible.', parade: 'Parade sensible.' })
    expect(reponseLevier(scenario().pourquoi, 'autre', l)).toEqual({ libelle: 'Autre chose / je ne sais pas', truc: 'Truc générique.', parade: 'Parade générique.' })
  })
})
