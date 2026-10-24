import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FicheMissionPage from '@/pages/FicheMissionPage.vue'
import PlanBPage from '@/pages/PlanBPage.vue'
import { creerStore, definirStore } from '@/store/useProgress'
import { fourcheFixture, nomLieuFourche as nomDe } from './fixtures'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

vi.mock('@/content', async () => {
  const { creerAcces } = await import('@/content/acces')
  const f = await import('./fixtures')
  return creerAcces({
    generatedAt: '2026-10-05T10:00:00.000Z',
    themes: f.themesFixture(),
    leviers: f.leviersFixture(),
    missions: [f.fourcheFixture({ theme: 'jeux-achats' })],
  })
})

beforeEach(() => definirStore(creerStore(new MemoryStorage())))

const monter = async (composant: Parameters<typeof mount>[0], chemin: string) =>
  mount(composant, { global: { plugins: [await routerTest(chemin)] } })
const mission = fourcheFixture()

describe('fiche enseignant d’un parcours à deux routes', () => {
  it('présente le schéma, chaque route et la piste de débrief', async () => {
    const w = await monter(FicheMissionPage, `/enseignants/${mission.id}`)
    const t = w.text()
    expect(t).toContain('Les deux routes')
    expect(t).toContain('Lieux 1 – 2, puis selon le choix : 3a – 4a ou 3b – 4b, puis 5')
    expect(t).toContain('Si les élèves choisissent « je garde mon mot de passe » : 3a')
    expect(t).toContain('Si les élèves choisissent « je demande à un adulte » : 3b')
    expect(t).toContain('Parcours de l’île en 7 lieux, 5 par route :')
    expect(t).not.toContain('5 lieux par route')
    expect(t).toContain(`3a ${nomDe('a3')}`)
    expect(t).toContain(`4b ${nomDe('b4')}`)
    expect(t).toContain('Comparez les deux routes : les deux sont bonnes, qu’est-ce qui change ?')
  })
})

describe('plan B d’un parcours à deux routes', () => {
  it('numérote les lieux et renvoie d’un lieu à l’autre', async () => {
    const w = await monter(PlanBPage, `/enseignants/${mission.id}/plan-b`)
    const t = w.text()
    for (const [n, id] of [['1', 'l1'], ['2', 'l2'], ['3a', 'a3'], ['4a', 'a4'], ['3b', 'b3'], ['4b', 'b4'], ['5', 'l5']]) {
      expect(t).toContain(`Lieu ${n} : ${nomDe(id!)}`)
    }
    expect(t).toContain('Si tu choisis « Je garde mon mot de passe », va au lieu 3a. Si tu choisis « Je demande de l’aide à un adulte », va au lieu 3b. Si tu as coché un autre choix, relis la situation et choisis à nouveau.')
    expect(t.match(/Va au lieu 5\./g)).toHaveLength(2)
    const corrige = w.find('.corrige').text()
    for (const n of ['1', '2', '3a', '4a', '3b', '4b', '5']) expect(corrige).toContain(`Lieu ${n} :`)
  })
  it('le renvoi du lieu de bifurcation vient après le bloc « pourquoi »', async () => {
    const w = await monter(PlanBPage, `/enseignants/${mission.id}/plan-b`)
    const section = w.findAll('section.etape-papier').find((x) => x.text().includes(`Lieu 2 : ${nomDe('l2')}`))!
    expect(section.element.lastElementChild?.classList.contains('renvoi')).toBe(true)
  })
})
