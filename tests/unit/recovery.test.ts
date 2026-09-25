import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { RECOVERY_ACTIONS } from '@/content/schema'
import Activer2fa from '@/recovery/Activer2fa.vue'
import BloquerSignaler from '@/recovery/BloquerSignaler.vue'
import CapturePreuve from '@/recovery/CapturePreuve.vue'
import ChangerMdp from '@/recovery/ChangerMdp.vue'
import DemanderAide from '@/recovery/DemanderAide.vue'
import PrevenirContacts from '@/recovery/PrevenirContacts.vue'
import { evaluerMotDePasse } from '@/recovery/motDePasse'
import { RECUPERATIONS } from '@/recovery/registry'
import { bouton, cliquer } from './helpers'

describe('evaluerMotDePasse', () => {
  it.each([
    ['abc', 'Au moins 12 caractères'],
    ['azerty123456789', 'suites connues'],
    ['aaaaaaaaaaaaaaa', 'caractères variés'],
  ])('refuse « %s »', (mdp, probleme) => {
    expect(evaluerMotDePasse(mdp).join(' ')).toContain(probleme)
  })
  it('accepte une phrase de passe', () => {
    expect(evaluerMotDePasse('chat-bleu-mange-pizza')).toEqual([])
  })
})

describe('actions de récupération', () => {
  it('a un composant pour chaque action du schéma', () => {
    expect(Object.keys(RECUPERATIONS).sort()).toEqual([...RECOVERY_ACTIONS].sort())
  })

  it('bloquer-signaler : menu, bloquer, motif, envoyer', async () => {
    const w = mount(BloquerSignaler)
    await cliquer(w, 'Menu du contact')
    await cliquer(w, 'Bloquer')
    expect(bouton(w, 'Envoyer le signalement').attributes('disabled')).toBeDefined()
    await w.find('input[value="Faux compte"]').setValue()
    await cliquer(w, 'Envoyer le signalement')
    await cliquer(w, 'Continuer')
    expect(w.emitted('fait')).toHaveLength(1)
  })

  it('changer-mdp : exige un mot de passe solide et la déconnexion des autres appareils', async () => {
    const w = mount(ChangerMdp)
    await cliquer(w, 'Paramètres')
    await cliquer(w, 'Sécurité et connexion')
    await w.find('input#nouveau-mdp').setValue('abc')
    expect(bouton(w, 'Enregistrer').attributes('disabled')).toBeDefined()
    await w.find('input#nouveau-mdp').setValue('chat-bleu-mange-pizza')
    expect(bouton(w, 'Enregistrer').attributes('disabled')).toBeDefined()
    await w.find('input[type="checkbox"]').setValue(true)
    await w.find('form').trigger('submit')
    await cliquer(w, 'Continuer')
    expect(w.emitted('fait')).toHaveLength(1)
  })

  it('activer-2fa : méthode puis code', async () => {
    const w = mount(Activer2fa)
    await cliquer(w, 'Paramètres')
    await cliquer(w, 'Activer la double authentification')
    await w.find('input[value="appli"]').setValue()
    await cliquer(w, 'Suivant')
    await w.find('input#code-2fa').setValue('000000')
    expect(bouton(w, 'Valider').attributes('disabled')).toBeDefined()
    await w.find('input#code-2fa').setValue('482 913')
    await cliquer(w, 'Valider')
    await cliquer(w, 'Continuer')
    expect(w.emitted('fait')).toHaveLength(1)
  })

  it('capture-preuve : impossible de bloquer avant la capture', async () => {
    const w = mount(CapturePreuve)
    expect(bouton(w, 'Bloquer le compte').attributes('disabled')).toBeDefined()
    await cliquer(w, 'Faire une capture d’écran')
    await cliquer(w, 'Bloquer le compte')
    await cliquer(w, 'Continuer')
    expect(w.emitted('fait')).toHaveLength(1)
  })

  it('prevenir-contacts : explique pourquoi un mauvais message ne convient pas', async () => {
    const w = mount(PrevenirContacts)
    await w.find('input[value="codes"]').setValue()
    await cliquer(w, 'Envoyer')
    expect(w.text()).toContain('C’est exactement ce que ferait un pirate')
    expect(w.emitted('fait')).toBeUndefined()
    await w.find('input[value="bon"]').setValue()
    await cliquer(w, 'Envoyer')
    await cliquer(w, 'Continuer')
    expect(w.emitted('fait')).toHaveLength(1)
  })

  it('demander-aide : toute personne choisie est valable', async () => {
    const w = mount(DemanderAide)
    await cliquer(w, 'Le 3018')
    expect(w.text()).toContain('Des spécialistes t’écoutent')
    await cliquer(w, 'Continuer')
    expect(w.emitted('fait')).toHaveLength(1)
  })
})
