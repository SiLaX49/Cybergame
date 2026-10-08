import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { Ecran, Scenario } from '@/content/schema'
import Telephone from '@/phone/Telephone.vue'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import { missionFixture } from './fixtures'
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
    return mount(Telephone, { props: { ecran: s.ecran, choix: s.choix, ...props } })
  }

  it('n’affiche ni les choix ni aucun bouton : ils sont dans la scène, à côté', () => {
    const w = monter()
    expect(w.find('[data-choix]').exists()).toBe(false)
    expect(w.findAll('button')).toHaveLength(0)
  })

  it('zone du choix joué présente dès le départ, vide', () => {
    const zone = monter().find('.choix-joue')
    expect(zone.attributes('role')).toBe('status')
    expect(zone.text()).toBe('')
  })

  it('un geste se joue en bannière neutre', async () => {
    const w = monter({ choixJoue: null })
    await w.setProps({ choixJoue: 'clic' })
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
  })
})

describe('Telephone : séquence de retour', () => {
  const scenario = () => missionFixture().etapes[0] as Scenario
  const indices = [{ libelle: 'L’adresse est bizarre', passage: 'colis-expres.info' }, { libelle: 'On me presse' }]
  const avecReaction = () =>
    scenario().choix.map((c) => (c.id === 'clic' ? { ...c, reaction: 'Merci, à très vite !', reactionSimple: 'Merci !' } : c))
  const monter = (props: Record<string, unknown> = {}) => {
    const s = scenario()
    return mount(Telephone, { props: { ecran: s.ecran, choix: avecReaction(), indices, choixJoue: null, ...props } })
  }
  const statut = (w: ReturnType<typeof monter>) => w.find('[role="status"]').text()
  const avancer = async (ms: number) => {
    vi.advanceTimersByTime(ms)
    await nextTick()
  }

  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('avec réaction : envoi, écrit, réaction, verdict, indices numérotés, fin', async () => {
    const w = monter()
    await w.setProps({ choixJoue: 'clic' })
    expect(statut(w)).toContain('Lien ouvert')
    expect(statut(w)).not.toContain('en train d’écrire')
    await avancer(150)
    expect(statut(w)).toContain('Colis Express est en train d’écrire…')
    await avancer(750)
    expect(statut(w)).toContain('Merci, à très vite !')
    expect(statut(w)).not.toContain('en train d’écrire')
    expect(w.find('figure').attributes('data-verdict')).toBeUndefined()
    await avancer(100)
    expect(w.find('figure').attributes('data-verdict')).toBe('piege')
    expect(w.find('figure').classes()).toContain('secousse')
    expect(statut(w)).toContain('Piège')
    expect(w.find('.verdict svg').attributes('aria-hidden')).toBe('true')
    expect(w.find('.passage').exists()).toBe(false)
    await avancer(400)
    const passage = w.find('.ecran .passage')
    expect(passage.text()).toContain('colis-expres.info')
    expect(passage.find('.numero').text()).toBe('1')
    expect(passage.find('.visually-hidden').text()).toBe('indice 1 :')
    expect(w.emitted('sequence-finie')).toBeUndefined()
    await avancer(400)
    expect(w.emitted('sequence-finie')).toEqual([[]])
    await avancer(5000)
    expect(w.emitted('sequence-finie')).toHaveLength(1)
  })

  it('lecture simplifiée : réaction simplifiée', async () => {
    store.modifierReglages({ lectureSimple: true })
    const w = monter()
    await w.setProps({ choixJoue: 'clic' })
    await avancer(900)
    expect(statut(w)).toContain('Merci !')
  })

  it('sans réaction : pas d’« en train d’écrire », verdict à 600 ms, bon réflexe', async () => {
    const w = monter()
    await w.setProps({ choixJoue: 'verif' })
    await avancer(300)
    expect(statut(w)).not.toContain('en train d’écrire')
    await avancer(299)
    expect(w.find('figure').attributes('data-verdict')).toBeUndefined()
    await avancer(1)
    expect(w.find('figure').attributes('data-verdict')).toBe('bon')
    expect(w.find('figure').classes()).toContain('rebond')
    expect(statut(w)).toContain('Bon réflexe')
  })

  it('le choix « aide » compte comme bon réflexe', async () => {
    store.modifierReglages({ animations: false })
    const w = monter()
    await w.setProps({ choixJoue: 'aide' })
    expect(w.find('figure').attributes('data-verdict')).toBe('bon')
  })

  it('animations désactivées : tout d’un coup, fin au prochain tick', async () => {
    store.modifierReglages({ animations: false })
    const w = monter()
    await w.setProps({ choixJoue: 'clic' })
    expect(statut(w)).toContain('Lien ouvert')
    expect(statut(w)).toContain('Merci, à très vite !')
    expect(statut(w)).not.toContain('en train d’écrire')
    expect(statut(w)).toContain('Piège')
    expect(w.find('.ecran .passage .numero').text()).toBe('1')
    await nextTick()
    expect(w.emitted('sequence-finie')).toEqual([[]])
  })

  it('retour à l’attente en pleine séquence : plus rien ne s’affiche', async () => {
    const w = monter()
    await w.setProps({ choixJoue: 'clic' })
    await avancer(500)
    await w.setProps({ choixJoue: null })
    expect(statut(w)).toBe('')
    await avancer(5000)
    expect(statut(w)).toBe('')
    expect(w.find('figure').attributes('data-verdict')).toBeUndefined()
    expect(w.find('.passage').exists()).toBe(false)
    expect(w.emitted('sequence-finie')).toBeUndefined()
  })

  it('rejouer après la fin : la séquence repart et finit une seconde fois', async () => {
    const w = monter()
    await w.setProps({ choixJoue: 'clic' })
    await avancer(1800)
    await w.setProps({ choixJoue: null })
    await w.setProps({ choixJoue: 'clic' })
    expect(w.find('figure').attributes('data-verdict')).toBeUndefined()
    await avancer(1800)
    expect(w.emitted('sequence-finie')).toHaveLength(2)
  })

  it('démontage en pleine séquence : aucune erreur, aucune émission', async () => {
    const w = monter()
    await w.setProps({ choixJoue: 'clic' })
    await avancer(500)
    w.unmount()
    expect(() => vi.advanceTimersByTime(5000)).not.toThrow()
    expect(w.emitted('sequence-finie')).toBeUndefined()
  })

  it('indice joué (`indiceVisible`) : passages surlignés sans numéro avant le choix, sans bouton dans le téléphone', async () => {
    const w = monter()
    expect(w.find('.passage').exists()).toBe(false)
    expect(w.findAll('button').some((b) => b.text().includes('Indice'))).toBe(false)
    await w.setProps({ indiceVisible: true })
    const passage = w.find('.ecran .passage')
    expect(passage.text()).toContain('colis-expres.info')
    expect(passage.find('.numero').exists()).toBe(false)
  })
})

describe('Telephone : entrée par notification', () => {
  const scenario = () => missionFixture().etapes[0] as Scenario
  const monter = (props: Record<string, unknown> = {}) => {
    const s = scenario()
    return mount(Telephone, { props: { ecran: s.ecran, choix: s.choix, entree: true, ...props }, attachTo: document.body })
  }
  const accueil = '[aria-label="Revenir à l’écran d’accueil"]'
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('démarre verrouillé : une notification, le début du premier message, aucun choix', () => {
    const w = monter()
    expect(w.find('figure').attributes('data-app')).toBe('verrouillage')
    expect(w.find('figure').attributes('aria-label')).toBe('Écran de téléphone : écran verrouillé')
    const notif = w.find('[data-notification]')
    expect(notif.attributes('aria-label')).toBe('Ouvrir la notification Messages de Colis Express')
    const texte = notif.find(`[id="${notif.attributes('aria-describedby')}"]`).text()
    expect(texte).toHaveLength(60)
    expect(texte).toBe('Votre colis est bloqué : payez 1,99 € sur colis-expres.info…')
    expect(w.find('[data-choix]').exists()).toBe(false)
    expect(w.find('.entete-app').exists()).toBe(false)
    expect(w.find(accueil).exists()).toBe(false)
  })

  it('texte de notification propre à l’écran, s’il est donné', () => {
    const s = scenario()
    const w = monter({ ecran: { ...s.ecran, notification: 'Ton colis t’attend' } })
    expect(w.find('[data-notification]').text()).toContain('Ton colis t’attend')
  })

  it('toucher la notification ouvre l’appli avec un zoom, focus sur la zone de l’écran', async () => {
    const w = monter()
    await w.find('[data-notification]').trigger('click')
    await nextTick()
    expect(w.find('figure').attributes('data-app')).toBe('sms')
    expect(w.find('.ecran').classes()).toContain('zoom')
    expect(document.activeElement).toBe(w.find('.ecran').element)
  })

  it('accueil : appli du scénario en couleur avec pastille, les autres en blanc et annoncées', async () => {
    const w = monter()
    await w.find('[data-notification]').trigger('click')
    await w.find(accueil).trigger('click')
    await nextTick()
    expect(w.find('figure').attributes('data-app')).toBe('accueil')
    expect(w.find('[data-choix]').exists()).toBe(false)
    expect(document.activeElement).toBe(w.find('.ecran').element)
    expect(w.findAll('.dock [data-appli]').map((b) => b.attributes('data-appli'))).toEqual(['Messages', 'Navigateur', 'Mail', 'SnapTalk'])
    expect(w.findAll('.grille [data-appli]').length).toBeGreaterThan(0)
    const active = w.find('[data-appli="Messages"]')
    expect(active.attributes('aria-disabled')).toBeUndefined()
    expect(active.find('.pastille').exists()).toBe(true)
    expect(active.text()).toContain('1 notification')
    const meteo = w.find('[data-appli="Météo"]')
    expect(meteo.attributes('aria-disabled')).toBe('true')
    expect(meteo.find('.pastille').exists()).toBe(false)
    const annonce = w.find('.accueil [role="status"]')
    expect(annonce.text()).toBe('')
    await meteo.trigger('click')
    expect(annonce.text()).toBe('Météo : pas disponible dans ce scénario')
    await w.find('[data-appli="Mail"]').trigger('click')
    expect(annonce.text()).toBe('Mail : pas disponible dans ce scénario')
    expect(w.find('figure').attributes('data-app')).toBe('accueil')
  })

  it('toucher l’appli du scénario sur l’accueil la rouvre', async () => {
    const w = monter()
    await w.find('[data-notification]').trigger('click')
    await w.find(accueil).trigger('click')
    await w.find('[data-appli="Messages"]').trigger('click')
    expect(w.find('figure').attributes('data-app')).toBe('sms')
  })

  it('après le choix : pas de bouton « Accueil » ; « Rejouer » reste dans l’appli ; un nouvel écran reverrouille', async () => {
    store.modifierReglages({ animations: false })
    const w = monter({ choixJoue: null })
    await w.find('[data-notification]').trigger('click')
    await w.setProps({ choixJoue: 'clic' })
    expect(w.find(accueil).exists()).toBe(false)
    await w.setProps({ choixJoue: null })
    expect(w.find('figure').attributes('data-app')).toBe('sms')
    await w.setProps({ ecran: { ...scenario().ecran, contact: 'Autre' } })
    expect(w.find('figure').attributes('data-app')).toBe('verrouillage')
  })

  it('choix déjà joué au montage : l’appli est ouverte', () => {
    store.modifierReglages({ animations: false })
    const w = monter({ choixJoue: 'clic' })
    expect(w.find('figure').attributes('data-app')).toBe('sms')
    expect(w.find('.choix-joue').text()).toContain('Lien ouvert')
  })

  it('émet son état au départ puis à chaque changement', async () => {
    const w = monter()
    expect(w.emitted('etat')).toEqual([['verrouille']])
    await w.find('[data-notification]').trigger('click')
    await w.find(accueil).trigger('click')
    expect(w.emitted('etat')).toEqual([['verrouille'], ['appli'], ['accueil']])
    expect(monter({ entree: undefined }).emitted('etat')).toEqual([['appli']])
  })

  it('sans `entree` : comportement v1, appli ouverte, ni notification ni « Accueil »', () => {
    const w = monter({ entree: undefined })
    expect(w.find('figure').attributes('data-app')).toBe('sms')
    expect(w.find('[data-notification]').exists()).toBe(false)
    expect(w.find(accueil).exists()).toBe(false)
  })
})
