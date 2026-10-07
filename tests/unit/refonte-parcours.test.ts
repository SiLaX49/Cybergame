import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Lieu } from '@/content/schema'
import LieuStep from '@/mission/LieuStep.vue'
import EnseignantsPage from '@/pages/EnseignantsPage.vue'
import MissionPage from '@/pages/MissionPage.vue'
import { creerStore, definirStore } from '@/store/useProgress'
import { leviersFixture, parcoursFixture } from './fixtures'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

vi.mock('@/content', async () => (await import('./content-mock-parcours')).contentMock)

beforeEach(() => definirStore(creerStore(new MemoryStorage())))

describe('refonte visuelle : parcours et espace enseignant', () => {
  it('la bulle du guide porte la Hulotte', () => {
    const lieu = mount(LieuStep, {
      props: { lieu: parcoursFixture().etapes[0] as Lieu, phase: 'situation', mode: 'solo', sensible: false, leviers: leviersFixture() },
    })
    expect(lieu.find('.recit svg.hulotte').exists()).toBe(true)
    expect(lieu.find('.recit').text().length).toBeGreaterThan(0)
  })

  it('l’écran de départ accueille avec la Hulotte', async () => {
    const depart = mount(MissionPage, { global: { plugins: [await routerTest('/mission/p-parcours')] } })
    expect(depart.find('svg.hulotte[data-expression="accueil"]').exists()).toBe(true)
  })

  it('chaque mission listée a sa pastille de thème', async () => {
    const enseignants = mount(EnseignantsPage, { global: { plugins: [await routerTest('/enseignants')] } })
    expect(enseignants.findAll('.pastille-theme').length).toBeGreaterThan(0)
  })
})
