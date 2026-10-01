import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Fil, Scenario } from '@/content/schema'
import RepereGame from '@/minigames/RepereGame.vue'
import TriGame from '@/minigames/TriGame.vue'
import FilStep from '@/mission/FilStep.vue'
import MinijeuStep from '@/mission/MinijeuStep.vue'
import ScenarioStep from '@/mission/ScenarioStep.vue'
import MissionPage from '@/pages/MissionPage.vue'
import Activer2fa from '@/recovery/Activer2fa.vue'
import BloquerSignaler from '@/recovery/BloquerSignaler.vue'
import CapturePreuve from '@/recovery/CapturePreuve.vue'
import ChangerMdp from '@/recovery/ChangerMdp.vue'
import PrevenirContacts from '@/recovery/PrevenirContacts.vue'
import { creerStore, definirStore } from '@/store/useProgress'
import AppHeader from '@/ui/AppHeader.vue'
import { leviersFixture, missionFixture, rappelFixture, repereFixture, triFixture } from './fixtures'
import { bouton, cliquer } from './helpers'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

vi.mock('@/content', async () => (await import('./content-mock')).contentMock)

let montes: VueWrapper[] = []
beforeEach(() => {
  definirStore(creerStore(new MemoryStorage()))
})
afterEach(() => {
  montes.forEach((w) => w.unmount())
  montes = []
})

function monter<T>(composant: T, options: Record<string, unknown> = {}): VueWrapper {
  const w = mount(composant as never, { attachTo: document.body, ...options }) as VueWrapper
  montes.push(w)
  return w
}
const actif = () => document.activeElement as HTMLElement | null

describe('gestion du focus', () => {
  it('ScenarioStep : la situation reçoit le focus à l’affichage, puis le titre à chaque phase', async () => {
    const scenario = missionFixture().etapes[0] as Scenario
    const w = monter(ScenarioStep, {
      props: { scenario, phase: 'situation', mode: 'solo', sensible: false, leviers: leviersFixture() },
    })
    await flushPromises()
    expect(actif()?.tagName).toBe('ARTICLE')
    expect(actif()?.getAttribute('aria-label')).toBe('Situation : message de Colis Express dans Messages')
    await w.setProps({ phase: 'indices' })
    await flushPromises()
    expect(actif()?.textContent).toBe('Qu’est-ce qui t’a décidé ?')
  })

  it('MinijeuStep et FilStep : le titre reçoit le focus à l’affichage', async () => {
    const etape = { type: 'minijeu' as const, id: 'mj', jeu: 'repere' as const, config: repereFixture() }
    monter(MinijeuStep, { props: { etape, chrono: false } })
    await flushPromises()
    expect(actif()?.textContent).toBe('Mini-jeu')
    monter(FilStep, { props: { fil: rappelFixture().etapes[0] as Fil } })
    await flushPromises()
    expect(actif()?.tagName).toBe('H2')
  })

  it('fin de mission : le titre reçoit le focus', async () => {
    const router = await routerTest('/mission/r-test')
    const w = monter(MissionPage, { global: { plugins: [router] } })
    for (const n of ['n1', 'n2', 'n3']) await w.find(`input[name="notif-${n}"][value="ouvrir"]`).setValue()
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(actif()?.textContent).toBe('Mission terminée !')
  })

  it('débrief en grand : focus sur « Fermer », Échap ferme et rend le focus au bouton d’ouverture', async () => {
    const router = await routerTest('/mission/r-test')
    const w = monter(MissionPage, { global: { plugins: [router] } })
    for (const n of ['n1', 'n2', 'n3']) await w.find(`input[name="notif-${n}"][value="ouvrir"]`).setValue()
    await w.find('form').trigger('submit')
    await cliquer(w, 'Afficher les questions en grand')
    await flushPromises()
    expect(actif()?.textContent?.trim()).toBe('Fermer')
    await w.find('dialog').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(w.find('dialog').exists()).toBe(false)
    expect(actif()?.textContent?.trim()).toBe('Afficher les questions en grand')
  })

  it.each([
    ['bloquer-signaler', BloquerSignaler, 'Menu du contact'],
    ['changer-mdp', ChangerMdp, 'Paramètres'],
    ['activer-2fa', Activer2fa, 'Paramètres'],
  ])('%s : le focus suit le changement d’étape', async (_nom, composant, texte) => {
    const w = monter(composant)
    await cliquer(w, texte)
    await flushPromises()
    expect(actif()?.tagName).toBe('H3')
  })

  it('capture-preuve et prevenir-contacts : le focus ne retombe jamais sur la page', async () => {
    const w = monter(CapturePreuve)
    await cliquer(w, 'Faire une capture d’écran')
    await flushPromises()
    expect(actif()?.textContent).toContain('Bloquer le compte')
    await cliquer(w, 'Bloquer le compte')
    await flushPromises()
    expect(actif()?.tagName).toBe('H3')
    const p = monter(PrevenirContacts)
    await p.find('input[value="bon"]').setValue()
    await cliquer(p, 'Envoyer')
    await flushPromises()
    expect(actif()?.tagName).toBe('H3')
  })

  it('TriGame : focus sur « Suivant » après une réponse, puis sur la nouvelle carte', async () => {
    const w = monter(TriGame, { props: { config: triFixture(), chrono: false } })
    await cliquer(w, 'Arnaque')
    await flushPromises()
    expect(actif()?.textContent?.trim()).toBe('Suivant')
    await cliquer(w, 'Suivant')
    await flushPromises()
    expect(actif()?.textContent).toContain('Maman : je rentre à 19 h')
  })

  it('Réglages : « Fermer » et Échap rendent le focus au bouton Réglages', async () => {
    const router = await routerTest('/')
    const w = monter(AppHeader, { global: { plugins: [router] } })
    await cliquer(w, 'Réglages')
    await cliquer(w, 'Fermer')
    await flushPromises()
    expect(w.find('#panneau-reglages').exists()).toBe(false)
    expect(actif()?.getAttribute('aria-controls')).toBe('panneau-reglages')
    await cliquer(w, 'Réglages')
    await w.find('#panneau-reglages').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(w.find('#panneau-reglages').exists()).toBe(false)
    expect(actif()?.getAttribute('aria-controls')).toBe('panneau-reglages')
  })
})

describe('régions annoncées', () => {
  it('TriGame : la région de retour reste en place et change de contenu', async () => {
    const w = mount(TriGame, { props: { config: triFixture(), chrono: false } })
    const region = w.find('[role="status"]')
    expect(region.exists()).toBe(true)
    await cliquer(w, 'Arnaque')
    expect(w.find('[role="status"]').element).toBe(region.element)
    expect(region.text()).toContain('Bien vu !')
  })

  it('RepereGame : « Rien de suspect ici. » est ré-annoncé à chaque clic', async () => {
    const w = mount(RepereGame, { props: { config: repereFixture() } })
    const region = w.find('[role="status"]')
    expect(region.exists()).toBe(true)
    await cliquer(w, 'Identifiant')
    await flushPromises()
    expect(region.text()).toBe('Rien de suspect ici.')
    const contenus: string[] = []
    const observateur = new MutationObserver(() => contenus.push(region.element.textContent ?? ''))
    observateur.observe(region.element, { childList: true, characterData: true, subtree: true })
    await bouton(w, 'Mot de passe').trigger('click')
    await flushPromises()
    observateur.disconnect()
    expect(contenus).toEqual(['', 'Rien de suspect ici.'])
  })
})
