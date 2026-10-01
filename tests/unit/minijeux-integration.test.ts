import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ConfidentialiteGame from '@/minigames/ConfidentialiteGame.vue'
import MotDePasseGame from '@/minigames/MotDePasseGame.vue'
import PermissionsGame from '@/minigames/PermissionsGame.vue'
import VerificationGame from '@/minigames/VerificationGame.vue'
import MinijeuStep from '@/mission/MinijeuStep.vue'
import PlanBPage from '@/pages/PlanBPage.vue'
import { creerStore, definirStore } from '@/store/useProgress'
import {
  confidentialiteFixture,
  motdepasseFixture,
  permissionsFixture,
  verificationFixture,
} from './fixtures'
import { cliquer } from './helpers'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

vi.mock('@/content', async () => {
  const { creerAcces } = await import('@/content/acces')
  const f = await import('./fixtures')
  const mission = (id: string, jeu: string, config: unknown) =>
    f.missionFixture({ id, etapes: [f.rawScenario('sc-1'), { type: 'minijeu', id: 'mj-1', jeu, config }] })
  return creerAcces({
    generatedAt: '2026-10-01T10:00:00.000Z',
    themes: f.themesFixture(),
    leviers: f.leviersFixture(),
    missions: [
      mission('m-mdp', 'motdepasse', f.rawMotdepasse()),
      mission('m-conf', 'confidentialite', f.rawConfidentialite()),
      mission('m-verif', 'verification', f.rawVerification()),
      mission('m-perm', 'permissions', f.rawPermissions()),
    ],
  })
})

beforeEach(() => definirStore(creerStore(new MemoryStorage())))

describe('MinijeuStep', () => {
  it.each([
    ['motdepasse', motdepasseFixture(), MotDePasseGame],
    ['confidentialite', confidentialiteFixture(), ConfidentialiteGame],
    ['verification', verificationFixture(), VerificationGame],
    ['permissions', permissionsFixture(), PermissionsGame],
  ] as const)('rend le mini-jeu « %s »', (jeu, config, composant) => {
    const etape = { type: 'minijeu' as const, id: 'mj', jeu, config } as never
    const w = mount(MinijeuStep, { props: { etape, chrono: false } })
    expect(w.findComponent(composant).exists()).toBe(true)
  })

  it('transmet la fin du mini-jeu au moteur', async () => {
    const etape = { type: 'minijeu' as const, id: 'mj', jeu: 'motdepasse' as const, config: motdepasseFixture() }
    const w = mount(MinijeuStep, { props: { etape, chrono: false } })
    await cliquer(w, 'Je passe')
    await cliquer(w, 'Terminer le mini-jeu')
    expect(w.emitted('evenement')).toEqual([[{ type: 'minijeu-termine', reussites: 0, erreurs: 1 }]])
  })
})

describe('PlanBPage', () => {
  const papier = async (id: string) => mount(PlanBPage, { global: { plugins: [await routerTest(`/enseignants/${id}/plan-b`)] } })

  it('mot de passe : critères à cocher et exemple au corrigé', async () => {
    const w = await papier('m-mdp')
    expect(w.text()).toContain('☐ Au moins 12 caractères')
    expect(w.text()).toContain('girafe-violette-sous-la-pluie')
  })
  it('confidentialité : options à cocher et réglage conseillé au corrigé', async () => {
    const w = await papier('m-conf')
    expect(w.text()).toContain('☐ Tout le monde')
    expect(w.text()).toContain('Qui peut voir mon profil → Mes amis')
  })
  it('vérification : verdict à cocher et réponse au corrigé', async () => {
    const w = await papier('m-verif')
    expect(w.text()).toContain('☐ Fiable ☐ Douteux ☐ Faux')
    expect(w.text()).toContain('Verdict : Faux')
  })
  it('permissions : tableau Autoriser / Refuser et réponses au corrigé', async () => {
    const w = await papier('m-perm')
    expect(w.text()).toContain('Lire tes contacts')
    expect(w.text()).toContain('Super Lampe · Lire tes contacts → Refuser')
  })
})
