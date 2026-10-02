import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import VerificationGame from '@/minigames/VerificationGame.vue'
import { verificationFixture } from './fixtures'
import { bouton, cliquer } from './helpers'

const monter = () => mount(VerificationGame, { props: { config: verificationFixture() } })

describe('VerificationGame', () => {
  it('montre la publication et l’image décrite', () => {
    const w = monter()
    expect(w.text()).toContain('InfosChoc')
    expect(w.text()).toContain('Image (décrite) : Un requin dans une rue inondée, devant une boulangerie.')
  })

  it('chaque action d’enquête révèle son résultat', async () => {
    const w = monter()
    expect(w.text()).not.toContain('Aucun média ne parle de ce requin.')
    await cliquer(w, 'Chercher la source')
    expect(w.text()).toContain('Aucun média ne parle de ce requin.')
  })

  it('le résultat d’une enquête est annoncé et relié à son bouton', async () => {
    const w = monter()
    const region = w.find('.annonce-enquete')
    expect(region.attributes('role')).toBe('status')
    expect(region.text()).toBe('')
    const source = bouton(w, 'Chercher la source')
    expect(source.attributes('aria-pressed')).toBeUndefined()
    await cliquer(w, 'Chercher la source')
    await flushPromises()
    expect(w.find('.annonce-enquete').element).toBe(region.element)
    expect(region.text()).toBe('Aucun média ne parle de ce requin.')
    expect(source.attributes('aria-pressed')).toBeUndefined()
    expect(source.attributes('aria-describedby')).toBe('res-source')
    expect(w.find('#res-source').text()).toBe('Aucun média ne parle de ce requin.')
    await cliquer(w, 'Recherche d’image inversée')
    await flushPromises()
    expect(region.text()).toBe('La même image circule depuis 2017, dans d’autres villes.')
  })

  it('cliquer à nouveau sur une enquête la ré-annonce', async () => {
    const w = monter()
    const region = w.find('.annonce-enquete')
    await cliquer(w, 'Chercher la source')
    await flushPromises()
    const contenus: string[] = []
    const observateur = new MutationObserver(() => contenus.push(region.element.textContent ?? ''))
    observateur.observe(region.element, { childList: true, characterData: true, subtree: true })
    await bouton(w, 'Chercher la source').trigger('click')
    await flushPromises()
    observateur.disconnect()
    expect(contenus).toEqual(['', 'Aucun média ne parle de ce requin.'])
  })

  it('bon verdict après enquête', async () => {
    const w = monter()
    await cliquer(w, 'Recherche d’image inversée')
    await w.find('[data-verdict="faux"]').trigger('click')
    expect(w.find('.resultat-verdict').text()).toContain('Bien vu')
    expect(w.text()).toContain('C’est un montage ancien, partagé à chaque orage.')
    expect(w.text()).not.toContain('Astuce')
    await cliquer(w, 'Terminer le mini-jeu')
    expect(w.emitted('termine')).toEqual([[{ reussites: 1, erreurs: 0 }]])
  })

  it('mauvais verdict sans enquête : la bonne réponse et une astuce', async () => {
    const w = monter()
    await w.find('[data-verdict="fiable"]').trigger('click')
    expect(w.find('.resultat-verdict').text()).toContain('La bonne réponse : Faux')
    expect(w.text()).toContain('Astuce : enquête avant de décider')
    await cliquer(w, 'Terminer le mini-jeu')
    expect(w.emitted('termine')).toEqual([[{ reussites: 0, erreurs: 1 }]])
  })

  it('un double clic sur un verdict ne compte qu’une fois', async () => {
    const w = monter()
    const faux = w.find('[data-verdict="faux"]')
    void faux.trigger('click')
    await w.find('[data-verdict="douteux"]').trigger('click')
    expect(w.findAll('[data-verdict]').every((b) => b.attributes('disabled') !== undefined)).toBe(true)
    await cliquer(w, 'Terminer le mini-jeu')
    expect(w.emitted('termine')).toEqual([[{ reussites: 1, erreurs: 0 }]])
  })
})
