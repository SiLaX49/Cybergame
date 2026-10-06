import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { RECOVERY_ACTIONS } from '@/content/schema'
import Activer2fa from '@/recovery/Activer2fa.vue'
import BloquerSignaler from '@/recovery/BloquerSignaler.vue'
import CapturePreuve from '@/recovery/CapturePreuve.vue'
import ChangerMdp from '@/recovery/ChangerMdp.vue'
import DemanderAide from '@/recovery/DemanderAide.vue'
import PrevenirContacts from '@/recovery/PrevenirContacts.vue'
import CorrigerPartage from '@/recovery/CorrigerPartage.vue'
import RetirerPublication from '@/recovery/RetirerPublication.vue'
import Soutenir from '@/recovery/Soutenir.vue'
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

  it('corriger-partage : un message qui ne corrige rien est expliqué sans blâmer', async () => {
    const w = mount(CorrigerPartage)
    await w.find('input[value="supprimer"]').setValue()
    await cliquer(w, 'Envoyer')
    expect(w.text()).toContain('ceux qui l’ont déjà vu croient encore que c’est vrai')
    expect(w.emitted('fait')).toBeUndefined()
    await w.find('input[value="rien"]').setValue()
    await cliquer(w, 'Envoyer')
    expect(w.text()).toContain('ils risquent de le partager à leur tour')
    expect(w.emitted('fait')).toBeUndefined()
    await w.find('input[value="bon"]').setValue()
    await cliquer(w, 'Envoyer')
    expect(w.text()).toContain('Tu as arrêté la rumeur de ton côté')
    await cliquer(w, 'Continuer')
    expect(w.emitted('fait')).toHaveLength(1)
  })

  it('soutenir : un message maladroit est expliqué sans blâmer, un bon message termine', async () => {
    const w = mount(Soutenir)
    await w.find('input[value="minimise"]').setValue()
    await cliquer(w, 'Envoyer')
    expect(w.text()).toContain('il peut donner l’impression que ce n’est pas grave')
    expect(w.emitted('fait')).toBeUndefined()
    await w.find('input[value="public"]').setValue()
    await cliquer(w, 'Envoyer')
    expect(w.text()).toContain('Répondre en public peut relancer les attaques')
    expect(w.emitted('fait')).toBeUndefined()
    await w.find('input[value="adulte"]').setValue()
    await cliquer(w, 'Envoyer')
    expect(w.text()).toContain('Message envoyé.')
    expect(w.text()).toContain('Garde une capture des messages')
    await cliquer(w, 'Continuer')
    expect(w.emitted('fait')).toHaveLength(1)
  })

  it('soutenir : le message d’écoute termine aussi', async () => {
    const w = mount(Soutenir)
    await w.find('input[value="ecoute"]').setValue()
    await cliquer(w, 'Envoyer')
    expect(w.text()).toContain('Message envoyé.')
  })

  it('retirer-publication : supprimer, des excuses sincères, puis demander de ne pas repartager', async () => {
    const w = mount(RetirerPublication)
    expect(w.find('input[type="radio"]').exists()).toBe(false)
    await cliquer(w, 'Supprimer ma publication')
    expect(w.text()).toContain('Publication supprimée.')
    expect(w.text()).not.toContain('ne pas repartager')
    await w.find('input[value="pas-vraiment"]').setValue()
    await cliquer(w, 'Envoyer')
    expect(w.text()).toContain('Cette excuse rejette la faute sur l’autre')
    await w.find('input[value="rien"]').setValue()
    await cliquer(w, 'Envoyer')
    expect(w.text()).toContain('Supprimer ne suffit pas toujours')
    expect(w.text()).not.toContain('ne pas repartager')
    await w.find('input[value="sinceres"]').setValue()
    await cliquer(w, 'Envoyer')
    expect(w.emitted('fait')).toBeUndefined()
    await cliquer(w, 'Demander aux autres de ne pas repartager')
    expect(w.text()).toContain('C’est possible de réparer.')
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
