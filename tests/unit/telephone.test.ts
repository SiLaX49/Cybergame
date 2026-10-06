import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Ecran, Scenario } from '@/content/schema'
import { ordreAffichage } from '@/engine/ordre'
import Telephone from '@/phone/Telephone.vue'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import { missionFixture } from './fixtures'
import { cliquer } from './helpers'
import { MemoryStorage } from './memory-storage'

let store: ProgressStore
beforeEach(() => {
  store = creerStore(new MemoryStorage())
  definirStore(store)
})

const sms = (surcharge: Partial<Ecran> = {}) =>
  ({
    app: 'sms',
    appNom: 'Messages',
    contact: 'Colis Express',
    messages: [
      { de: 'contact', texte: 'Payez 1,99 € sur colis-xp.net', texteSimple: 'Paie 1,99 €', heure: '09:12', apercu: { titre: 'Suivi de colis', domaine: 'colis-xp.net' } },
      { de: 'moi', texte: 'C’est quoi ?', heure: '09:14' },
    ],
    ...surcharge,
  }) as Ecran

describe('Telephone : coque', () => {
  it('figure nommée, appli repérée, zone défilante atteignable au clavier', () => {
    const w = mount(Telephone, { props: { ecran: sms() } })
    const figure = w.find('figure')
    expect(figure.attributes('aria-label')).toBe('Écran de téléphone : Messages')
    expect(figure.attributes('data-app')).toBe('sms')
    const zone = w.find('.ecran')
    expect(zone.attributes('tabindex')).toBe('0')
    expect(zone.attributes('role')).toBe('region')
    expect(zone.attributes('aria-label')).toBe('Contenu de l’écran : Messages')
  })


  it('barre d’état décorative à l’heure du dernier message, 14:32 sinon', () => {
    const w = mount(Telephone, { props: { ecran: sms() } })
    expect(w.find('.barre-etat').attributes('aria-hidden')).toBe('true')
    expect(w.find('.barre-etat').text()).toContain('09:14')
    const sansHeure = sms({ messages: [{ de: 'contact', texte: 'Salut' }] })
    expect(mount(Telephone, { props: { ecran: sansHeure } }).find('.barre-etat').text()).toContain('14:32')
  })

  it('en-tête : contact, nom de l’appli, avatar décoratif (icône pour un numéro)', () => {
    const w = mount(Telephone, { props: { ecran: sms() } })
    expect(w.find('.entete-app').text()).toContain('Colis Express')
    expect(w.find('.entete-app').text()).toContain('Messages')
    expect(w.find('.avatar').attributes('aria-hidden')).toBe('true')
    expect(w.find('.avatar').text()).toBe('CE')
    const numero = mount(Telephone, { props: { ecran: sms({ contact: '+33 6 39 98 12 48' }) } })
    expect(numero.find('.avatar').text()).toBe('')
    expect(numero.find('.avatar svg').exists()).toBe(true)
  })
})

describe('Telephone : conversation', () => {
  it('bulles avec qui parle, heure, lien repéré et aperçu', () => {
    const w = mount(Telephone, { props: { ecran: sms() } })
    const bulles = w.findAll('.conversation > li')
    expect(bulles).toHaveLength(2)
    expect(bulles[0]!.text()).toContain('Colis Express :')
    expect(bulles[0]!.find('.lien').text()).toContain('colis-xp.net')
    expect(bulles[0]!.find('.lien .visually-hidden').text()).toBe('lien :')
    expect(bulles[0]!.find('.apercu').text()).toContain('Suivi de colis')
    expect(bulles[0]!.find('.heure').text()).toContain('09:12')
    expect(bulles[1]!.text()).toContain('Toi :')
    expect(bulles[1]!.find('.bulle').classes()).toContain('moi')
  })

  it('chat : même conversation, thème de l’appli', () => {
    const w = mount(Telephone, { props: { ecran: sms({ app: 'chat', appNom: 'ChatCord' }) } })
    expect(w.find('figure').attributes('data-app')).toBe('chat')
    expect(w.findAll('.conversation > li')).toHaveLength(2)
  })

  it('lecture simplifiée', () => {
    store.modifierReglages({ lectureSimple: true })
    const w = mount(Telephone, { props: { ecran: sms() } })
    expect(w.findAll('.conversation > li')[0]!.text()).toContain('Paie 1,99 €')
  })
})

const messages = [{ de: 'contact' as const, texte: 'Votre mot de passe expire.', heure: '07:58' }]

describe('Telephone : mail', () => {
  const mail = { app: 'mail', appNom: 'Mail', contact: 'Mon Collège', adresse: 'support@moncollege-ent.net', sujet: 'Mot de passe', pieceJointe: { nom: 'procedure.pdf' }, messages } as Ecran
  it('objet, expéditeur avec sa vraie adresse, heure, pièce jointe', () => {
    const w = mount(Telephone, { props: { ecran: mail } })
    expect(w.find('.sujet').text()).toContain('Mot de passe')
    expect(w.find('.expediteur').text()).toContain('De :')
    expect(w.find('.expediteur').text()).toContain('Mon Collège')
    expect(w.find('.adresse').text()).toBe('support@moncollege-ent.net')
    expect(w.find('.expediteur').text()).toContain('07:58')
    expect(w.find('.piece-jointe').text()).toContain('Pièce jointe :')
    expect(w.find('.piece-jointe').text()).toContain('procedure.pdf')
    expect(w.find('.entete-app').text()).toContain('Mail')
  })
})

describe('Telephone : web', () => {
  const web = (url?: string) => ({ app: 'web', appNom: 'Navigateur', contact: 'Wi-Fi Gare Libre', url, messages }) as Ecran
  it('barre d’adresse : domaine mis en avant, jamais de cadenas', () => {
    const w = mount(Telephone, { props: { ecran: web('https://gare-libre-wifi.com/connexion') } })
    expect(w.find('.domaine').text()).toBe('gare-libre-wifi.com')
    expect(w.find('.reste').text()).toBe('/connexion')
    expect(w.text()).not.toContain('Non sécurisé')
    expect(w.find('.titre-page').text()).toBe('Wi-Fi Gare Libre')
    expect(w.find('.entete-app').exists()).toBe(false)
  })
  it('« Non sécurisé » pour une adresse http', () => {
    expect(mount(Telephone, { props: { ecran: web('http://gare-wifi.com') } }).find('.non-securise').text()).toContain('Non sécurisé')
  })
  it('sans adresse : écran d’appli, pas de barre', () => {
    expect(mount(Telephone, { props: { ecran: web() } }).find('.barre-adresse').exists()).toBe(false)
  })
})

describe('Telephone : social', () => {
  const social = {
    app: 'social', appNom: 'StreamTube', contact: 'drole_de_college_42', messages, certifie: true, abonnes: '2 400', bio: 'Parodie',
    media: { description: 'Vidéo de 5 secondes : M. Durand crie.', descriptionSimple: 'Une vidéo de 5 secondes.' },
    stats: { vues: '1 200', partages: '87' }, commentaires: [{ de: 'lea_42', texte: 'Trop drôle' }],
  } as Ecran
  it('compte, publication, média décrit, compteurs, commentaires', () => {
    const w = mount(Telephone, { props: { ecran: social } })
    expect(w.find('.compte').text()).toContain('drole_de_college_42')
    expect(w.find('.compte').text()).toContain('(compte certifié)')
    expect(w.find('.compte').text()).toContain('2 400 abonnés')
    expect(w.find('.compte').text()).toContain('Parodie')
    expect(w.find('.media').text()).toContain('Vidéo de 5 secondes : M. Durand crie.')
    expect(w.find('.stats').text()).toBe('1 200 vues · 87 partages')
    expect(w.find('.commentaires').text()).toContain('lea_42')
    expect(w.find('.commentaires').text()).toContain('Trop drôle')
  })
  it('média en lecture simplifiée', () => {
    store.modifierReglages({ lectureSimple: true })
    expect(mount(Telephone, { props: { ecran: social } }).find('.media').text()).toContain('Une vidéo de 5 secondes.')
  })
})

describe('Telephone : choix', () => {
  const scenario = () => missionFixture().etapes[0] as Scenario
  const monter = (props: Record<string, unknown> = {}) => {
    const s = scenario()
    return mount(Telephone, { props: { ecran: s.ecran, choix: s.choix, graine: s.id, ...props } })
  }

  it('affiche les choix en bas de l’appli, dans l’ordre du scénario, et émet le choix', async () => {
    const s = scenario()
    const w = monter()
    expect(w.find('.actions-app').text()).toContain('Que fais-tu ?')
    expect(w.findAll('[data-choix]').map((b) => b.attributes('data-choix'))).toEqual(ordreAffichage(s.choix, s.id).map((c) => c.id))
    await w.find('[data-choix="verif"]').trigger('click')
    expect(w.emitted('choisir')).toEqual([['verif']])
  })

  it('classe : un clic sélectionne, l’adulte valide', async () => {
    const w = monter({ mode: 'classe' })
    await w.find('[data-choix="verif"]').trigger('click')
    expect(w.emitted('choisir')).toBeUndefined()
    expect(w.find('[data-choix="verif"]').attributes('aria-pressed')).toBe('true')
    await cliquer(w, 'Valider le choix de la classe')
    expect(w.emitted('choisir')).toEqual([['verif']])
  })

  it('zone du choix joué présente dès le départ, vide', () => {
    const zone = monter().find('.choix-joue')
    expect(zone.attributes('role')).toBe('status')
    expect(zone.text()).toBe('')
  })

  it('un geste se joue en bannière neutre, et les actions disparaissent', async () => {
    const w = monter({ choixJoue: null })
    await w.setProps({ choixJoue: 'clic' })
    expect(w.find('[data-choix]').exists()).toBe(false)
    expect(w.find('.choix-joue').text()).toContain('Lien ouvert')
  })

  it('une réponse se joue en bulle « Toi »', async () => {
    const s = scenario()
    const choix = s.choix.map((c) => (c.id === 'verif' ? { ...c, geste: 'repondre' as const, reponse: 'C’est qui ?' } : c))
    const w = monter({ choix, choixJoue: 'verif' })
    expect(w.find('.choix-joue').text()).toContain('Toi :')
    expect(w.find('.choix-joue').text()).toContain('C’est qui ?')
  })

  it('le choix « aide » pose le téléphone', () => {
    expect(monter({ choixJoue: 'aide' }).find('.choix-joue').text()).toContain('Tu poses ton téléphone pour demander de l’aide')
  })

  it('« Rejouer » remet le téléphone en attente', async () => {
    const w = monter({ choixJoue: 'clic' })
    await w.setProps({ choixJoue: null })
    expect(w.find('.choix-joue').text()).toBe('')
    expect(w.findAll('[data-choix]')).toHaveLength(3)
  })
})
