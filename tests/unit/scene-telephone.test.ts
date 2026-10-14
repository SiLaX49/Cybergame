import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'
import type { Fil, Scenario } from '@/content/schema'
import { ordreAffichage } from '@/engine/ordre'
import MissionBarre from '@/mission/MissionBarre.vue'
import SceneTelephone from '@/phone/SceneTelephone.vue'
import type { Scene } from '@/phone/scene'
import { creerStore, definirStore } from '@/store/useProgress'
import { missionFixture, rappelFixture } from './fixtures'
import { bouton, cliquer } from './helpers'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

beforeEach(() => {
  const store = creerStore(new MemoryStorage())
  definirStore(store)
  store.modifierReglages({ animations: false })
})

const scenario = () => missionFixture().etapes[0] as Scenario
const monter = (scene: Partial<Scene> = {}) => {
  const s = scenario()
  return mount(SceneTelephone, {
    props: { scene: { ecran: s.ecran, choix: s.choix, graine: s.id, ...scene } },
    slots: {
      entete: ({ idQuestion }: { idQuestion: string }) => h('h2', { id: idQuestion }, s.question),
      default: () => h('p', { class: 'suite' }, 'Suite de la page'),
    },
  })
}

describe('SceneTelephone', () => {
  it('téléphone à gauche, panneau à droite : région nommée, en-tête, choix, puis le slot par défaut', () => {
    const w = monter()
    const panneau = w.find('.scene-panneau')
    expect(w.find('.scene-grille').element.firstElementChild?.tagName).toBe('FIGURE')
    expect(panneau.attributes()).toMatchObject({ role: 'region', tabindex: '0', 'aria-label': 'Question et explications' })
    expect(Array.from(panneau.element.children).map((e) => e.tagName)).toEqual(['H2', 'DIV', 'P'])
    expect(panneau.find('.suite').text()).toBe('Suite de la page')
    expect(w.find('figure [data-choix]').exists()).toBe(false)
  })

  it('choix A/B/C/D dans l’ordre du scénario, groupe nommé par la question, sans « Que fais-tu ? » ajouté', () => {
    const s = scenario()
    const w = monter()
    const groupe = w.find('[role="group"]')
    expect(groupe.attributes('aria-labelledby')).toBe(w.find('h2').attributes('id'))
    expect(w.findAll('[data-choix]').map((b) => b.attributes('data-choix'))).toEqual(ordreAffichage(s.choix, s.id).map((c) => c.id))
    expect(w.findAll('.lettre').map((l) => l.text())).toEqual(['A', 'B', 'C'])
    expect(w.find('[data-choix="aide"]').attributes('data-qualite')).toBe('aide')
    expect(w.find('[data-choix="aide"]').attributes('aria-pressed')).toBeUndefined()
    expect(w.text().match(/Que fais-tu \?/g)).toHaveLength(1)
  })

  it('réémet le choix, puis masque les choix une fois le choix joué', async () => {
    const w = monter()
    await w.find('[data-choix="verif"]').trigger('click')
    expect(w.emitted('choisir')).toEqual([['verif']])
    await w.setProps({ scene: { ...w.props('scene'), choixJoue: 'verif' } })
    expect(w.find('[data-choix]').exists()).toBe(false)
    expect(w.find('.choix-joue').text()).not.toBe('')
    await nextTick()
    expect(w.emitted('sequence-finie')).toEqual([[]])
  })

  it('entrée par notification : pas de choix tant que l’écran est verrouillé ou sur l’accueil', async () => {
    const w = monter({ entree: true })
    expect(w.find('[data-notification]').exists()).toBe(true)
    expect(w.find('[data-choix]').exists()).toBe(false)
    await w.find('[data-notification]').trigger('click')
    expect(w.findAll('[data-choix]')).toHaveLength(3)
    await w.find('[aria-label="Revenir à l’écran d’accueil"]').trigger('click')
    expect(w.find('figure').attributes('data-app')).toBe('accueil')
    expect(w.find('[data-choix]').exists()).toBe(false)
    await w.find('[data-appli="Messages"]').trigger('click')
    expect(w.findAll('[data-choix]')).toHaveLength(3)
    // Un nouvel écran reverrouille le téléphone : les choix repartent.
    await w.setProps({ scene: { ...w.props('scene'), ecran: { ...scenario().ecran, contact: 'Autre' } } })
    expect(w.find('figure').attributes('data-app')).toBe('verrouillage')
    expect(w.find('[data-choix]').exists()).toBe(false)
  })

  it('classe : un clic sélectionne, l’adulte valide', async () => {
    const w = monter({ mode: 'classe' })
    await w.find('[data-choix="verif"]').trigger('click')
    expect(w.emitted('choisir')).toBeUndefined()
    expect(w.find('[data-choix="verif"]').attributes('aria-pressed')).toBe('true')
    await cliquer(w, 'Valider le choix de la classe')
    expect(w.emitted('choisir')).toEqual([['verif']])
  })

  it('fil de notifications : pas de choix, l’action d’une notification est réémise', async () => {
    const fil = rappelFixture().etapes[0] as Fil
    const w = mount(SceneTelephone, { props: { scene: { ecran: { app: 'verrouillage', notifications: fil.notifications }, actionsNotif: {} } } })
    expect(w.find('[data-choix]').exists()).toBe(false)
    await w.find('[data-notif]').trigger('click')
    await cliquer(w, 'J’ignore')
    expect(w.emitted('agir')?.[0]?.[1]).toBe('ignorer')
  })
})

describe('MissionBarre : bouton « Indice »', () => {
  const monterBarre = async (indice?: 'disponible' | 'joue') =>
    mount(MissionBarre, { props: { titre: 'Mission', etape: 1, total: 3, indice }, global: { plugins: [await routerTest('/')] } })

  it('absent sans indice à jouer', async () => {
    const w = await monterBarre()
    expect(w.findAll('button').some((b) => b.text().includes('Indice'))).toBe(false)
  })

  it('à côté de la progression ; un clic émet `indice`, puis il reste enfoncé', async () => {
    const w = await monterBarre('disponible')
    const centre = w.find('.centre')
    expect(centre.text()).toContain('Étape 1 sur 3')
    expect(bouton(centre, 'Indice').attributes('aria-pressed')).toBe('false')
    await cliquer(w, 'Indice')
    expect(w.emitted('indice')).toEqual([[]])
    await w.setProps({ indice: 'joue' })
    expect(bouton(w, 'Indice').attributes('aria-pressed')).toBe('true')
    await cliquer(w, 'Indice')
    expect(w.emitted('indice')).toHaveLength(1)
  })
})
