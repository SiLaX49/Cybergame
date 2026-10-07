import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { demarrer, type RunState } from '@/engine/mission-runner'
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
    expect(t).toContain('Ce qui peut faire hésiter')
    expect(t).toContain('Tu as fait les bons choix cette fois. Voici ce qui peut faire hésiter :')
    expect(t).not.toContain('craquer')
    expect(t).not.toContain('piège')
  })
})

describe('FinMission : réponse « Autre chose » et badges en thème sensible', () => {
  const monterAvec = async (etat: RunState, sensible: boolean) =>
    mount(FinMission, {
      props: { mission: missionFixture(), etat, leviers: leviersFixture(), sensible },
      global: { plugins: [await routerTest()] },
    })
  const avecResultat = (levier: 'autre' | null): RunState => ({
    ...demarrer(missionFixture()),
    termine: true,
    leviersCedes: levier ? [levier] : [],
    resultats: {
      'sc-1': {
        type: 'scenario', choixId: 'verif', qualite: 'bon', indicesChoisis: ['url'], indicesJustes: 1, indicesFaux: 0,
        levier, recuperationFaite: null, passe: false,
      },
    },
  })

  it('« Autre chose » : parade propre aux thèmes sensibles', async () => {
    expect((await monterAvec(avecResultat('autre'), true)).find('.craquer').text()).toContain('Autre chose / je ne sais pas : Parade sensible.')
    expect((await monterAvec(avecResultat('autre'), false)).find('.craquer').text()).toContain('Autre chose / je ne sais pas : Parade générique.')
  })

  it('« Œil de lynx » sans « piéger » en thème sensible, inchangé ailleurs', async () => {
    const sensible = (await monterAvec(avecResultat(null), true)).find('.badges').text()
    expect(sensible).toContain('Œil de lynx : Tu as repéré de vrais indices sans te laisser tromper par les faux.')
    expect(sensible).not.toMatch(/pi[eè]g/)
    const normal = (await monterAvec(avecResultat(null), false)).find('.badges').text()
    expect(normal).toContain('Œil de lynx : Tu as repéré de vrais indices sans te laisser piéger par les faux.')
  })
})
