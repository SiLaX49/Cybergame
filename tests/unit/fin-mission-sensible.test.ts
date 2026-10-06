import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { demarrer } from '@/engine/mission-runner'
import FinMission from '@/mission/FinMission.vue'
import { creerStore, definirStore } from '@/store/useProgress'
import { leviersFixture, missionFixture } from './fixtures'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

beforeEach(() => {
  definirStore(creerStore(new MemoryStorage()))
})

const texte = async (sensible?: boolean) => {
  const mission = missionFixture()
  const etat = { ...demarrer(mission), termine: true }
  const w = mount(FinMission, {
    props: { mission, etat, leviers: leviersFixture(), ...(sensible === undefined ? {} : { sensible }) },
    global: { plugins: [await routerTest()] },
  })
  return w.text()
}

describe('FinMission : texte neutre en thème sensible', () => {
  it('garde la formulation « piège » par défaut', async () => {
    expect(await texte(false)).toContain('Aucun piège n’a marché sur toi cette fois.')
    expect(await texte()).toContain('Aucun piège n’a marché sur toi cette fois.')
  })
  it('évite « piège » en thème sensible', async () => {
    const t = await texte(true)
    expect(t).toContain('Tu as fait les bons choix cette fois. Ce qui peut faire hésiter :')
    expect(t).not.toContain('piège')
  })
})
