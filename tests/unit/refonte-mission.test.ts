import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { demarrer } from '@/engine/mission-runner'
import ChoixList from '@/mission/ChoixList.vue'
import FinMission from '@/mission/FinMission.vue'
import SensibleAvertissement from '@/mission/SensibleAvertissement.vue'
import { creerStore, definirStore } from '@/store/useProgress'
import BandeauAide from '@/ui/BandeauAide.vue'
import BandeauBrouillon from '@/ui/BandeauBrouillon.vue'
import { leviersFixture, missionFixture } from './fixtures'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

beforeEach(() => {
  definirStore(creerStore(new MemoryStorage()))
})

const fin = async (sensible: boolean) => {
  const mission = missionFixture()
  return mount(FinMission, {
    props: { mission, etat: { ...demarrer(mission), termine: true }, leviers: leviersFixture(), sensible },
    global: { plugins: [await routerTest()] },
  })
}

describe('refonte visuelle : écrans de mission', () => {
  it('fin de mission normale : Hulotte « bravo »', async () => {
    expect((await fin(false)).find('svg.hulotte[data-expression="bravo"]').exists()).toBe(true)
  })
  it('fin de mission sensible : Hulotte « douce », ni étoiles ni fête', async () => {
    const w = await fin(true)
    expect(w.find('svg.hulotte[data-expression="douce"]').exists()).toBe(true)
    expect(w.find('.h-etoiles').exists()).toBe(false)
    expect(w.find('.fete').exists()).toBe(false)
  })
  it('avertissement des thèmes sensibles : Hulotte « douce » et encadré doux', async () => {
    const w = mount(SensibleAvertissement, { global: { plugins: [await routerTest()] } })
    expect(w.find('svg.hulotte[data-expression="douce"]').exists()).toBe(true)
    expect(w.classes()).toEqual(expect.arrayContaining(['encadre', 'encadre-doux']))
  })
  it('bandeau d’aide : encadré doux', () => {
    const w = mount(BandeauAide, { props: { aides: [{ type: 'urgence', numero: '17', libelle: 'Police' }] } })
    expect(w.classes()).toEqual(expect.arrayContaining(['encadre', 'encadre-doux']))
  })
  it('bandeau brouillon : encadré « aide » avec badge texte', () => {
    const w = mount(BandeauBrouillon)
    expect(w.classes()).toEqual(expect.arrayContaining(['encadre', 'encadre-aide']))
    expect(w.find('.badge').text()).toContain('Brouillon')
  })
  it('choix : boutons épais ; un choix déjà essayé garde sa mention texte', () => {
    const w = mount(ChoixList, {
      props: {
        choix: [
          { id: 'a', texte: 'Premier', qualite: 'bon' },
          { id: 'b', texte: 'Second', qualite: 'risque' },
        ],
        graine: 'g',
        mode: 'solo',
        essayes: ['b'],
      },
    })
    expect(w.findAll('button.choix-btn').length).toBeGreaterThan(1)
    expect(w.find('[data-choix="b"]').text()).toContain('déjà essayé')
  })
})
