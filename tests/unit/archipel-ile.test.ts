import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import IlePage from '@/pages/IlePage.vue'
import { demarrer } from '@/engine/mission-runner'
import FinMission from '@/mission/FinMission.vue'
import SensibleAvertissement from '@/mission/SensibleAvertissement.vue'
import { AVERTISSEMENT } from '@/mission/textesSensibles'
import { titrePage } from '@/router'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import { leviersFixture, missionFixture, themesFixture } from './fixtures'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

vi.mock('@/content', async () => {
  const { creerAcces } = await import('@/content/acces')
  const f = await import('./fixtures')
  return creerAcces({
    generatedAt: '2026-09-01T10:00:00.000Z',
    themes: f.themesFixture(),
    leviers: f.leviersFixture(),
    missions: [
      f.missionFixture(),
      f.parcoursFixture({ id: 'p-test' }),
      f.missionFixture({ id: 'm-sensible', theme: 'harcelement', titre: 'Mission sensible', relecture: { statut: 'a-relire' } }),
    ],
  })
})

let store: ProgressStore
beforeEach(() => {
  store = creerStore(new MemoryStorage())
  definirStore(store)
  store.choisirTranche('6e')
  store.choisirMode('solo')
})

async function monter(chemin: string) {
  const router = await routerTest(chemin)
  const w = mount(IlePage, { global: { plugins: [router] } })
  return { w, router }
}

describe('page de l’île', () => {
  it('liste le parcours d’abord, puis les missions classiques, avec statut', async () => {
    store.enregistrerMission('m-test', ['mission-accomplie'], {})
    const { w } = await monter('/ile/phishing')
    expect(w.find('h1').text()).toBe('Île aux hameçons')
    const items = w.findAll('ul.missions-ile > li')
    expect(items).toHaveLength(2)
    expect(items[0]!.text()).toContain('Parcours')
    expect(items[0]!.text()).toContain('La traversée de l’île test')
    expect(items[0]!.text()).not.toContain('Terminée')
    expect(items[1]!.text()).toContain('Mission test')
    expect(items[1]!.text()).toContain('Terminée')
    expect(items[1]!.find('a').attributes('href')).toBe('/mission/m-test')
    expect(w.text()).toContain('1 / 2 missions')
    expect(w.text()).toContain('le bouclier : pas encore')
  })

  it('objet gagné quand le parcours est terminé', async () => {
    store.enregistrerMission('p-test', ['mission-accomplie'], {})
    const { w } = await monter('/ile/phishing')
    expect(w.find('.badge-bon').text()).toContain('le bouclier gagné')
  })

  it('thème sensible : encadré doux avec le texte d’avertissement existant, sans objet', async () => {
    const { w } = await monter('/ile/harcelement')
    expect(w.find('h1').text()).toBe('Île de l’entraide')
    expect(w.find('.encadre.encadre-doux').text()).toContain(AVERTISSEMENT.paragraphes[0])
    expect(w.find('.encadre.encadre-doux svg.hulotte[data-expression="douce"]').exists()).toBe(true)
    expect(w.text()).not.toContain('pas encore')
    expect(w.text()).not.toContain('gagné')
  })

  it('thème inconnu : page introuvable', async () => {
    const router = await routerTest('/ile/inconnu')
    expect(router.currentRoute.value.name).toBe('introuvable')
  })

  it('changer seulement le paramètre (/ile/phishing → /ile/inconnu) passe aussi par la garde', async () => {
    const router = await routerTest('/ile/phishing')
    expect(router.currentRoute.value.name).toBe('ile')
    await router.push('/ile/inconnu')
    expect(router.currentRoute.value.name).toBe('introuvable')
    await router.push('/ile/phishing')
    await router.push('/ile/rappel')
    expect(router.currentRoute.value.name).toBe('introuvable')
  })

  it('affiche la description du thème et un titre « Missions » avant la liste', async () => {
    const { w } = await monter('/ile/phishing')
    expect(w.find('.ile-titres .description').text()).toBe(themesFixture().find((t) => t.id === 'phishing')!.description)
    const h2 = w.find('h2.titre-missions')
    expect(h2.text()).toBe('Missions')
    expect(h2.element.nextElementSibling?.classList.contains('missions-ile')).toBe(true)
  })

  it('île calme sans mission (brouillons masqués) : « Bientôt disponible », ni encadré ni liste', async () => {
    store.choisirTranche('lycee')
    const { w } = await monter('/ile/harcelement')
    expect(w.find('.bientot-ile').text()).toBe('Bientôt disponible')
    expect(w.find('.encadre').exists()).toBe(false)
    expect(w.find('ul.missions-ile').exists()).toBe(false)
    expect(w.find('h2.titre-missions').exists()).toBe(false)
    expect(w.text().match(/Bientôt disponible/g)).toHaveLength(1)
  })

  it('« rappel » n’est pas une île', async () => {
    const router = await routerTest('/ile/rappel')
    expect(router.currentRoute.value.name).toBe('introuvable')
  })

  it('sans tranche choisie : retour à l’accueil', async () => {
    definirStore(creerStore(new MemoryStorage()))
    const router = await routerTest('/ile/phishing')
    expect(router.currentRoute.value.name).toBe('accueil')
  })

  it('titre de l’onglet = nom de l’île', async () => {
    const router = await routerTest('/ile/phishing')
    expect(titrePage(router.currentRoute.value)).toBe('Île aux hameçons · Cyber Réflexes')
  })

  it('liens « Retour à l’archipel » en haut et en bas', async () => {
    const { w } = await monter('/ile/phishing')
    const liens = w.findAll('a').filter((a) => a.text() === 'Retour à l’archipel')
    expect(liens).toHaveLength(2)
    for (const l of liens) expect(l.attributes('href')).toBe('/carte')
    expect(liens[0]!.classes()).toContain('btn-discret')
  })
})

describe('liens de retour vers l’île', () => {
  const fin = async (mission = missionFixture()) =>
    mount(FinMission, {
      props: { mission, etat: { ...demarrer(mission), termine: true }, leviers: leviersFixture(), sensible: false },
      global: { plugins: [await routerTest()] },
    })

  it('fin de mission : « Retour à l’île » vers l’île du thème', async () => {
    const lien = (await fin()).findAll('a').find((a) => a.text() === 'Retour à l’île')
    expect(lien?.attributes('href')).toBe('/ile/phishing')
  })

  it('fin de mission sans île connue : « Retour à la carte »', async () => {
    const lien = (await fin(missionFixture({ theme: 'inconnu' }))).findAll('a').find((a) => a.text() === 'Retour à la carte')
    expect(lien?.attributes('href')).toBe('/carte')
  })

  it('avertissement sensible : texte inchangé, lien vers l’île', async () => {
    const w = mount(SensibleAvertissement, { props: { theme: 'harcelement' }, global: { plugins: [await routerTest()] } })
    const lien = w.findAll('a').find((a) => a.text() === AVERTISSEMENT.revenir)
    expect(lien?.attributes('href')).toBe('/ile/harcelement')
  })
})
