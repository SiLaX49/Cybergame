import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Scenario } from '@/content/schema'
import type { ScenarioResultat } from '@/engine/mission-runner'
import { ordreAffichage } from '@/engine/ordre'
import ScenarioStep from '@/mission/ScenarioStep.vue'
import { ordreLecture, textesLus } from '@/phone/ordreLecture'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import { leviersFixture, missionFixture } from './fixtures'
import { bouton, cliquer } from './helpers'
import { MemoryStorage } from './memory-storage'

let store: ProgressStore
beforeEach(() => {
  store = creerStore(new MemoryStorage())
  definirStore(store)
  store.modifierReglages({ animations: false })
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
/** Le téléphone démarre verrouillé : la notification ouvre l’appli et ses choix. */
const monterOuvert = async (props: Record<string, unknown> = {}) => {
  const w = monter(props)
  await w.find('[data-notification]').trigger('click')
  return w
}

describe('ScenarioStep', () => {
  it('démarre sur l’écran verrouillé : notification, question posée, choix à droite seulement une fois l’appli ouverte', async () => {
    const w = monter()
    expect(w.find('[data-notification]').attributes('aria-label')).toBe('Ouvrir la notification Messages de Colis Express')
    expect(w.find('[data-choix]').exists()).toBe(false)
    expect(w.find('h2').text()).toBe('Que fais-tu ?')
    await w.find('[data-notification]').trigger('click')
    expect(w.find('figure [data-choix]').exists()).toBe(false)
    expect(w.findAll('.scene-panneau [data-choix]')).toHaveLength(3)
    expect(w.find('.consigne-mode').text()).toBe('Ouvre la notification, puis choisis ta réponse à droite.')
  })

  it('situation (solo) : un clic sur un choix l’envoie', async () => {
    const w = await monterOuvert()
    expect(w.find('h2').text()).toBe('Que fais-tu ?')
    await w.find('[data-choix="aide"]').trigger('click')
    expect(w.emitted('evenement')).toEqual([[{ type: 'choisir', choixId: 'aide' }]])
  })

  it('les choix s’affichent dans l’ordre mélangé propre au scénario', async () => {
    const s = scenario()
    const w = await monterOuvert()
    expect(w.findAll('[data-choix]').map((b) => b.attributes('data-choix'))).toEqual(ordreAffichage(s.choix, s.id).map((c) => c.id))
  })

  it('classe : consigne pour l’adulte, à droite', () => {
    expect(monter({ mode: 'classe' }).text()).toContain('Votez à main levée, puis l’adulte valide le choix de la classe à droite.')
  })

  it('binôme : invite à discuter', () => {
    expect(monter({ mode: 'binome' }).text()).toContain('Discutez à deux, puis choisissez à droite.')
  })

  it('classe : le choix doit être validé par l’adulte', async () => {
    const w = await monterOuvert({ mode: 'classe' })
    await w.find('[data-choix="verif"]').trigger('click')
    expect(w.emitted('evenement')).toBeUndefined()
    expect(w.find('[data-choix="verif"]').attributes('aria-pressed')).toBe('true')
    await cliquer(w, 'Valider le choix de la classe')
    expect(w.emitted('evenement')).toEqual([[{ type: 'choisir', choixId: 'verif' }]])
  })

  it('après le choix, le téléphone joue le geste et le panneau passe à la suite', async () => {
    const w = monter({ phase: 'consequence', choixId: 'clic', resultat: { ...resultatClic, choixId: 'clic', qualite: 'risque' } })
    await flushPromises()
    expect(w.find('.choix-joue').text()).toContain('Lien ouvert')
    expect(w.find('[data-choix]').exists()).toBe(false)
    expect(w.find('h2').text()).toBe('Et alors, que se passe-t-il ?')
  })

  it('conséquence : verdict, vrais indices seulement, à retenir, continuer ou rejouer', async () => {
    const w = monter({ phase: 'consequence', resultat: resultatClic })
    expect(w.text()).toContain('Bon réflexe !')
    expect(w.text()).toContain('Aucun colis en attente.')
    expect(w.findAll('.liste-indices li').map((li) => li.find('.libelle').text()).sort()).toEqual(['L’adresse est bizarre', 'On me presse'])
    expect(w.text()).not.toContain('Le montant est petit')
    expect(w.text()).not.toContain('tu l’avais coché')
    expect(w.text()).toContain('Un transporteur ne demande pas de payer par SMS.')
    await cliquer(w, 'Rejouer ce scénario')
    await cliquer(w, 'Continuer')
    expect(w.emitted('evenement')).toEqual([[{ type: 'rejouer' }], [{ type: 'continuer' }]])
  })

  it('« Ce qui devait t’alerter » : indices numérotés dans l’ordre de lecture du téléphone, avec le passage cité', async () => {
    const s = scenario()
    const w = monter({ phase: 'consequence', choixId: 'verif', resultat: resultatClic })
    await flushPromises()
    const ordre = ordreLecture(ordreAffichage(s.indices, s.id), textesLus(s.ecran, (x) => x))
    const items = w.findAll('.liste-indices li')
    expect(items.map((li) => li.find('.numero').text())).toEqual(['1', '2'])
    expect(items.map((li) => li.find('.libelle').text())).toEqual(ordre.map((i) => i.libelle))
    const url = items.find((li) => li.text().includes('L’adresse est bizarre'))!
    expect(url.text()).toContain('« colis-expres.info »')
    // Même numéro que la pastille du passage surligné dans le téléphone.
    expect(w.find('.ecran .passage .numero').text()).toBe(url.find('.numero').text())
    expect(w.find('.explication').text()).toContain('L’adresse imite le vrai site et le message crée l’urgence.')
  })

  it('pourquoi : verdict, « Ce qui devait t’alerter », puis la question des leviers ; pas répété ensuite', async () => {
    const w = monter({ phase: 'pourquoi', choixId: 'clic' })
    await flushPromises()
    expect(w.find('.explication').text()).toContain('C’était risqué.')
    expect(w.find('.explication').text()).toContain('Ce qui devait t’alerter')
    expect(w.find('[data-levier="urgence"]').exists()).toBe(true)
    await w.setProps({ phase: 'consequence', resultat: { ...resultatClic, choixId: 'clic', qualite: 'risque', levier: 'urgence' } })
    expect(w.text()).toContain('Ce qui a marché sur toi')
    expect(w.find('.explication').exists()).toBe(false)
  })

  it('`indiceVisible` surligne les passages dans le téléphone ; le bouton « Indice » n’est pas dans la scène', async () => {
    const w = await monterOuvert()
    expect(w.findAll('button').some((b) => b.text().includes('Indice'))).toBe(false)
    expect(w.find('.ecran .passage').exists()).toBe(false)
    await w.setProps({ indiceVisible: true })
    expect(w.find('.ecran .passage').text()).toContain('colis-expres.info')
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

  it('le panneau de droite est une région nommée qui défile, avec la ligne de rôle en tête', async () => {
    const w = await monterOuvert({ scenario: { ...scenario(), role: 'temoin' } })
    const panneau = w.find('.scene-panneau')
    expect(panneau.attributes()).toMatchObject({ role: 'region', tabindex: '0', 'aria-label': 'Question et explications' })
    expect(panneau.element.firstElementChild?.textContent).toBe('Dans ce scénario, tu joues un·e témoin.')
    expect(panneau.find('h2').text()).toBe('Que fais-tu ?')
    expect(panneau.find('[role="group"]').attributes('aria-labelledby')).toBe(panneau.find('h2').attributes('id'))
  })
})

describe('ScenarioStep : le panneau attend la fin de la séquence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    store.modifierReglages({ animations: true })
  })
  afterEach(() => vi.useRealTimers())
  /** Avance le temps, puis laisse passer l’émission de fin du téléphone et le rendu du panneau. */
  const avancer = async (ms: number) => {
    vi.advanceTimersByTime(ms)
    for (let i = 0; i < 3; i++) await nextTick()
  }

  it('après un choix, le panneau ne montre que la question, puis la phase suivante', async () => {
    const w = monter()
    await w.setProps({ phase: 'consequence', choixId: 'verif', resultat: resultatClic })
    expect(w.find('h2').text()).toBe('Que fais-tu ?')
    expect(w.find('.consigne-mode').exists()).toBe(false)
    expect(w.find('.consequence').exists()).toBe(false)
    // Choix sans réaction : la séquence finit à 1 400 ms.
    await avancer(1399)
    expect(w.find('h2').text()).toBe('Que fais-tu ?')
    expect(w.find('.consequence').exists()).toBe(false)
    await avancer(1)
    expect(w.find('h2').text()).toBe('Et alors, que se passe-t-il ?')
    expect(w.find('.consequence').text()).toContain('Bon réflexe !')
  })

  it('« Rejouer » : retour à la question, la séquence repart de zéro au choix suivant', async () => {
    const w = monter()
    await w.setProps({ phase: 'consequence', choixId: 'verif', resultat: resultatClic })
    await avancer(5000)
    expect(w.find('.consequence').exists()).toBe(true)
    await w.setProps({ phase: 'situation', choixId: null, resultat: undefined })
    expect(w.find('h2').text()).toBe('Que fais-tu ?')
    expect(w.find('.consigne-mode').exists()).toBe(true)
    await w.setProps({ phase: 'consequence', choixId: 'aide', resultat: { ...resultatClic, choixId: 'aide', qualite: 'aide' } })
    expect(w.find('.consequence').exists()).toBe(false)
    await avancer(5000)
    expect(w.find('.consequence').text()).toContain('Ta mère confirme : arnaque.')
  })
})
