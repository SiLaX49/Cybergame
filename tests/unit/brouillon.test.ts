import { mount } from '@vue/test-utils'
import type { Component } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FicheMissionPage from '@/pages/FicheMissionPage.vue'
import MissionPage from '@/pages/MissionPage.vue'
import { creerStore, definirStore } from '@/store/useProgress'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

vi.mock('@/content', async () => (await import('./content-mock')).contentMock)

beforeEach(() => definirStore(creerStore(new MemoryStorage())))

async function monter(composant: Component, chemin: string) {
  const router = await routerTest(chemin)
  return mount(composant, { global: { plugins: [router] } })
}

describe('bandeau Brouillon', () => {
  it('MissionPage : pour toute mission à relire', async () => {
    const brouillon = await monter(MissionPage, '/mission/m-sensible')
    expect(brouillon.find('.bandeau-brouillon').text()).toContain('Brouillon')
    const nonSensible = await monter(MissionPage, '/mission/m-a-relire')
    expect(nonSensible.find('.bandeau-brouillon').text()).toContain('Brouillon')
    const normale = await monter(MissionPage, '/mission/m-test')
    expect(normale.find('.bandeau-brouillon').exists()).toBe(false)
  })

  it('FicheMissionPage : pour toute mission à relire', async () => {
    const brouillon = await monter(FicheMissionPage, '/enseignants/m-sensible')
    expect(brouillon.find('.bandeau-brouillon').text()).toContain('ne pas utiliser en classe')
    const nonSensible = await monter(FicheMissionPage, '/enseignants/m-a-relire')
    expect(nonSensible.find('.bandeau-brouillon').text()).toContain('ne pas utiliser en classe')
    const normale = await monter(FicheMissionPage, '/enseignants/m-test')
    expect(normale.find('.bandeau-brouillon').exists()).toBe(false)
  })
})
