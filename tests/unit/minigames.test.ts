import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import RepereGame from '@/minigames/RepereGame.vue'
import TriGame from '@/minigames/TriGame.vue'
import MinijeuStep from '@/mission/MinijeuStep.vue'
import { repereFixture, triFixture } from './fixtures'
import { cliquer } from './helpers'

afterEach(() => vi.useRealTimers())

describe('TriGame', () => {
  it('compte réussites et erreurs puis termine', async () => {
    const w = mount(TriGame, { props: { config: triFixture(), chrono: false } })
    expect(w.text()).toContain('Carte 1 sur 4')
    expect(w.find('[role="timer"]').exists()).toBe(false)
    await cliquer(w, 'Arnaque')
    expect(w.text()).toContain('Bien vu !')
    await cliquer(w, 'Suivant')
    await cliquer(w, 'Arnaque')
    expect(w.text()).toContain('Pas tout à fait : c’était « Légitime »')
    await cliquer(w, 'Suivant')
    await cliquer(w, 'Arnaque')
    await cliquer(w, 'Suivant')
    await cliquer(w, 'Légitime')
    await cliquer(w, 'Terminer le mini-jeu')
    expect(w.emitted('termine')).toEqual([[{ reussites: 3, erreurs: 1 }]])
  })

  it('avec chrono, le temps écoulé compte comme une erreur', async () => {
    vi.useFakeTimers()
    const w = mount(TriGame, { props: { config: triFixture(), chrono: true } })
    expect(w.find('[role="timer"]').text()).toContain('20 s')
    vi.advanceTimersByTime(20_000)
    await w.vm.$nextTick()
    expect(w.text()).toContain('Temps écoulé')
    expect(w.findAll('.tri-categories button').every((b) => b.attributes('disabled') !== undefined)).toBe(true)
  })
})

describe('RepereGame', () => {
  it('trouver tous les indices permet de terminer', async () => {
    const w = mount(RepereGame, { props: { config: repereFixture() } })
    expect(w.text()).toContain('Indices trouvés : 0 sur 2')
    await cliquer(w, 'Identifiant')
    expect(w.text()).toContain('Rien de suspect ici.')
    await cliquer(w, 'gamebox-login.xyz')
    expect(w.text()).toContain('Ce n’est pas le vrai site.')
    await cliquer(w, '10 000 Coins')
    await cliquer(w, 'Terminer le mini-jeu')
    expect(w.emitted('termine')).toEqual([[{ reussites: 2, erreurs: 1 }]])
  })

  it('« Voir la solution » révèle tout et compte les indices manqués', async () => {
    const w = mount(RepereGame, { props: { config: repereFixture() } })
    await cliquer(w, 'gamebox-login.xyz')
    await cliquer(w, 'Voir la solution')
    expect(w.text()).toContain('Trop beau pour être vrai.')
    await cliquer(w, 'Terminer le mini-jeu')
    expect(w.emitted('termine')).toEqual([[{ reussites: 1, erreurs: 1 }]])
  })
})

describe('MinijeuStep', () => {
  it('affiche le bon jeu et émet minijeu-termine', async () => {
    const etape = { type: 'minijeu' as const, id: 'mj', jeu: 'repere' as const, config: repereFixture() }
    const w = mount(MinijeuStep, { props: { etape, chrono: false } })
    expect(w.findComponent(RepereGame).exists()).toBe(true)
    await cliquer(w, 'Voir la solution')
    await cliquer(w, 'Terminer le mini-jeu')
    expect(w.emitted('evenement')).toEqual([[{ type: 'minijeu-termine', reussites: 0, erreurs: 2 }]])
  })
})
