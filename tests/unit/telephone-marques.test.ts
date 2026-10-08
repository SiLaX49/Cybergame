import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Ecran, Scenario } from '@/content/schema'
import { appli } from '@/phone/applis'
import Telephone from '@/phone/Telephone.vue'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import { missionFixture } from './fixtures'
import { MemoryStorage } from './memory-storage'

let store: ProgressStore
beforeEach(() => {
  store = creerStore(new MemoryStorage())
  definirStore(store)
})

const scenario = () => missionFixture().etapes[0] as Scenario
/** Écran de conversation du scénario de test, dans une autre appli. */
const conversation = (surcharge: Partial<Ecran> = {}) => ({ ...scenario().ecran, app: 'chat', ...surcharge }) as Ecran
const monter = (ecran: Ecran, props: Record<string, unknown> = {}) => mount(Telephone, { props: { ecran, choix: scenario().choix, ...props } })
const onglets = (w: ReturnType<typeof monter>) => w.findAll('.barre-onglets [data-onglet]').map((o) => o.attributes('data-onglet'))

/** Luminance relative WCAG 2 d’une couleur « #rrggbb ». */
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contraste = (a: string, b: string) => {
  const [claire, foncee] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (claire + 0.05) / (foncee + 0.05)
}

const MARQUES = [
  ['SnapTalk', 'snaptalk'],
  ['ChatCord', 'chatcord'],
  ['Messages', 'messages'],
  ['GameBox', 'gamebox'],
  ['GameBox Chat', 'gamebox'],
  ['Revendo', 'revendo'],
] as const

describe('coques de marque : marqueurs', () => {
  it('SnapTalk : anneau de story, flamme décorative, 5 onglets en icônes', () => {
    const w = monter(conversation({ appNom: 'SnapTalk', contact: 'Inès' }))
    const coque = w.find('[data-marque="snaptalk"]')
    expect(coque.find('.avec-story .avatar').exists()).toBe(true)
    expect(coque.find('.entete-app').text()).toContain('Inès')
    expect(coque.find('.serie').text()).toBe('🔥 12')
    expect(coque.find('.serie').attributes('aria-hidden')).toBe('true')
    expect(coque.find('.barre-onglets').attributes('aria-hidden')).toBe('true')
    expect(onglets(w)).toEqual(['Carte', 'Chat', 'Caméra', 'Stories', 'Spotlight'])
    expect(w.findAll('.barre-onglets svg')).toHaveLength(5)
  })

  it('ChatCord : colonne de serveurs décorative, contact ou « # salon », 4 onglets', () => {
    const w = monter(conversation({ appNom: 'ChatCord', contact: 'Groupe des 4e · Yanis' }))
    const serveurs = w.find('[data-marque="chatcord"] .serveurs')
    expect(serveurs.attributes('aria-hidden')).toBe('true')
    expect(serveurs.findAll('.serveur').length).toBeGreaterThanOrEqual(3)
    expect(w.find('.entete-app').text()).toContain('Groupe des 4e · Yanis')
    expect(w.find('.entete-app .avatar').exists()).toBe(true)
    expect(onglets(w)).toHaveLength(4)
    const salon = monter(conversation({ appNom: 'ChatCord', contact: 'Salon #4e-C' }))
    expect(salon.find('.entete-app strong').text()).toBe('# 4e-c')
    expect(salon.find('.entete-app .avatar').exists()).toBe(false)
    expect(monter(conversation({ appNom: 'ChatCord', contact: 'Salon de la classe' })).find('.entete-app strong').text()).toBe('# de-la-classe')
  })

  it('Messages : en-tête centré, « Numéro inconnu » lu pour un numéro, « Lu » sous la dernière bulle « Toi »', () => {
    const messages = [
      { de: 'moi' as const, texte: 'Bonjour ?' },
      { de: 'moi' as const, texte: 'C’est qui ?' },
      { de: 'contact' as const, texte: 'Ton colis.' },
    ]
    const w = monter(conversation({ app: 'sms', appNom: 'Messages', contact: '+33 6 39 98 12 48', messages }))
    const entete = w.find('[data-marque="messages"] .entete-messages')
    expect(entete.text()).toContain('+33 6 39 98 12 48')
    expect(entete.find('.inconnu').text()).toBe('Numéro inconnu')
    expect(entete.find('.inconnu').attributes('aria-hidden')).toBeUndefined()
    const lus = w.findAll('.conversation .lu')
    expect(lus).toHaveLength(1)
    expect(lus[0]!.attributes('aria-hidden')).toBe('true')
    expect(w.findAll('.conversation > li')[1]!.find('.lu').exists()).toBe(true)
    const nomme = monter(conversation({ app: 'sms', appNom: 'Messages', contact: 'Mamie' }))
    expect(nomme.find('.inconnu').exists()).toBe(false)
    expect(nomme.find('.lu').exists()).toBe(false)
  })

  it.each(['GameBox', 'GameBox Chat'])('%s : solde en Gemmes (hexagone), onglets Chat / Moi', (appNom) => {
    const w = monter(conversation({ appNom, contact: 'DarkWolf_77' }))
    const solde = w.find('[data-marque="gamebox"] .solde')
    expect(solde.text()).toMatch(/^💎\s1\s250 Gemmes$/)
    expect(solde.attributes('aria-hidden')).toBe('true')
    expect(solde.find('.hexagone').exists()).toBe(true)
    expect(onglets(w)).toEqual(['Chat', 'Moi'])
  })

  it('Revendo : fiche épinglée si le premier message donne un prix (prix lu, « Acheter » inerte)', () => {
    const w = monter(conversation({ appNom: 'Revendo', contact: 'Camille_B ★ 4,8' }))
    const fiche = w.find('[data-marque="revendo"] .fiche')
    expect(fiche.find('.prix').text()).toBe('1,99 €')
    expect(fiche.find('.prix').attributes('aria-hidden')).toBeUndefined()
    expect(fiche.find('.frais').text()).toBe('+ frais de protection')
    expect(fiche.find('.acheter').text()).toBe('Acheter')
    expect(fiche.find('.acheter').attributes('aria-hidden')).toBe('true')
    expect(fiche.find('button').exists()).toBe(false)
    const sansPrix = conversation({ appNom: 'Revendo', contact: 'GamerShop', messages: [{ de: 'moi', texte: 'Toujours disponible ?' }] })
    expect(monter(sansPrix).find('.fiche').exists()).toBe(false)
  })

  it('les autres applis gardent l’en-tête simple, sans coque', () => {
    const w = monter(conversation({ appNom: 'StreamTube', contact: 'NoaGaming_Officiel' }))
    expect(w.find('[data-marque]').exists()).toBe(false)
    expect(w.find('.entete-app').text()).toContain('NoaGaming_Officiel')
  })
})

describe('coques de marque : accent du registre', () => {
  it.each(MARQUES)('%s : accent et texte sur l’accent du registre (4.5:1 au moins), en-tête sur l’accent', (appNom, marque) => {
    const w = monter(conversation({ appNom }))
    const style = (w.find(`[data-marque="${marque}"]`).element as HTMLElement).style
    const a = appli(appNom)
    expect(style.getPropertyValue('--marque-accent')).toBe(a.accent)
    expect(style.getPropertyValue('--marque-texte')).toBe(a.texteSurAccent)
    expect(contraste(a.accent, a.texteSurAccent)).toBeGreaterThanOrEqual(4.5)
    if (marque !== 'messages') expect(w.find('.entete-app').classes()).toContain('sur-accent')
  })
})

describe('coques de marque : séquence et entrée', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it.each(MARQUES)('%s : la coque ne casse pas la séquence (choix joué, verdict, aucun bouton)', async (appNom, marque) => {
    store.modifierReglages({ animations: false })
    const w = monter(conversation({ appNom }), { choixJoue: null })
    expect(w.findAll('button')).toHaveLength(0)
    await w.setProps({ choixJoue: 'clic' })
    expect(w.find(`[data-marque="${marque}"] .choix-joue`).text()).toContain('Lien ouvert')
    expect(w.find('figure').attributes('data-verdict')).toBe('piege')
    expect(w.find('.choix-joue').text()).toContain('Piège')
    await w.vm.$nextTick()
    expect(w.emitted('sequence-finie')).toEqual([[]])
  })

  it('coque seulement dans l’appli ouverte, pas sur l’écran verrouillé', async () => {
    const w = mount(Telephone, { props: { ecran: conversation({ appNom: 'SnapTalk' }), entree: true }, attachTo: document.body })
    expect(w.find('[data-marque]').exists()).toBe(false)
    await w.find('[data-notification]').trigger('click')
    expect(w.find('[data-marque="snaptalk"]').exists()).toBe(true)
    expect(document.activeElement).toBe(w.find('.ecran').element)
  })
})

describe('coques de marque : surlignage de l’en-tête', () => {
  const indices = (passage: string) => [{ libelle: 'Inconnu', passage }]

  it('Messages : le numéro du contact est surligné et numéroté comme le corps', async () => {
    const numero = '+33 6 39 98 17 42'
    const w = monter(conversation({ app: 'sms', appNom: 'Messages', contact: numero }), { indices: indices(numero), choixJoue: null })
    expect(w.find('.entete-messages .passage').exists()).toBe(false)
    await w.setProps({ indiceVisible: true })
    expect(w.find('.entete-messages .passage').text()).toContain(numero)
    expect(w.find('.entete-messages .passage .numero').exists()).toBe(false)
    store.modifierReglages({ animations: false })
    await w.setProps({ choixJoue: 'clic' })
    expect(w.find('.entete-messages .passage .numero').text()).toBe('1')
    expect(w.find('.entete-messages .passage .visually-hidden').text()).toBe('indice 1 :')
  })

  it.each([
    ['SnapTalk', 'Léo_R (ami de Sarah)', 'Léo_R'],
    ['ChatCord', 'Nova_Dev', 'Nova_Dev'],
    ['StreamTube', 'NoaGaming_Officiel', 'NoaGaming_Officiel'],
  ])('%s : le passage du contact est surligné dans l’en-tête', async (appNom, contact, passage) => {
    const w = monter(conversation({ appNom, contact }), { indices: indices(passage), indiceVisible: true })
    const mark = w.find('.entete-app .passage')
    expect(mark.text()).toContain(passage)
    expect(mark.find('.visually-hidden').text()).toBe('indice :')
  })
})

/** Écrans des autres types (publication, mail, web), dans l’appli donnée. */
const publication = (appNom: string, surcharge: Partial<Ecran> = {}) =>
  conversation({ app: 'social', appNom, contact: 'drole_de_college_42', certifie: false, stats: { vues: '1 200' }, ...surcharge } as Partial<Ecran>)
const mail = (surcharge: Partial<Ecran> = {}) =>
  conversation({ app: 'mail', appNom: 'Mail', contact: 'GameBox', adresse: 'support@gamebox-verif.com', sujet: 'Urgent', ...surcharge } as Partial<Ecran>)
const page = (appNom: string, surcharge: Partial<Ecran> = {}) =>
  conversation({ app: 'web', appNom, contact: 'Super Lampe', url: 'https://gare-libre-wifi.com/connexion', ...surcharge } as Partial<Ecran>)
const actif = (w: ReturnType<typeof monter>) => w.find('.barre-onglets .onglet.actif').attributes('data-onglet')

describe('coques de marque : publication, mail, web et autres', () => {
  it('StreamTube : logo, « S’abonner » et pilule d’actions inertes, 5 onglets', () => {
    const w = monter(publication('StreamTube'))
    const coque = w.find('[data-marque="streamtube"]')
    expect(coque.find('.entete-streamtube').text()).toBe('StreamTube')
    expect(coque.find('.compte .abonner').text()).toBe('S’abonner')
    expect(coque.find('.abonner').attributes('aria-hidden')).toBe('true')
    expect(coque.find('.pilule').attributes('aria-hidden')).toBe('true')
    expect(coque.findAll('.pilule > span')).toHaveLength(3)
    expect(coque.find('.stats').text()).toBe('1 200 vues')
    expect(onglets(w)).toEqual(['Accueil', 'Courts', 'Créer', 'Abonnements', 'Toi'])
  })

  it('SnapTalk en publication : bandeau sur l’accent, Spotlight actif, sans « S’abonner »', () => {
    const w = monter(publication('SnapTalk'))
    expect(w.find('[data-marque="snaptalk"] .entete-app').classes()).toContain('sur-accent')
    expect(actif(w)).toBe('Spotlight')
    expect(w.find('.abonner').exists()).toBe(false)
    expect(w.find('.pilule').exists()).toBe(false)
  })

  it('Mail : « Écrire » décoratif, étoile, expéditeur en gras', () => {
    const w = monter(mail())
    const coque = w.find('[data-marque="mail"]')
    expect(coque.find('.entete-app').text()).toContain('Mail')
    expect(coque.find('.outils .etoile').exists()).toBe(true)
    expect(coque.find('.outils').attributes('aria-hidden')).toBe('true')
    expect(coque.find('.pied').attributes('aria-hidden')).toBe('true')
    expect(coque.find('.ecrire').text()).toBe('Écrire')
    expect(coque.find('.expediteur strong').text()).toBe('GameBox')
  })

  it('Navigateur : icône réglages avant le domaine entier, jamais de cadenas, bouton des onglets', () => {
    const w = monter(page('Navigateur'))
    const barre = w.find('[data-marque="navigateur"] .barre-adresse')
    expect(barre.find('.reglages').attributes('aria-hidden')).toBe('true')
    expect(barre.element.firstElementChild).toBe(barre.find('.reglages').element)
    expect(barre.find('.domaine').text()).toBe('gare-libre-wifi.com')
    expect(barre.find('.lien').exists()).toBe(false)
    expect(w.html()).not.toMatch(/lucide-lock/)
    expect(onglets(w)).toEqual(['Précédent', 'Suivant', 'Accueil', 'Onglets', 'Menu'])
    expect(w.find('.compteur-onglets').text()).toBe('2')
  })

  it.each(['Revendo', 'BanqueNova', 'Mon Collège'])('page web de %s : toujours dans le navigateur (accent du Navigateur)', (appNom) => {
    const w = monter(page(appNom))
    const coque = w.find('[data-marque="navigateur"]')
    expect(coque.exists()).toBe(true)
    expect(w.findAll('[data-marque]')).toHaveLength(1)
    expect((coque.element as HTMLElement).style.getPropertyValue('--marque-accent')).toBe(appli('Navigateur').accent)
    expect(coque.find('.barre-adresse .domaine').text()).toBe('gare-libre-wifi.com')
  })

  it('Magasin (seule exception) : fiche avec note, badge d’âge et « Obtenir » inerte ; onglets Aujourd’hui / Jeux / Recherche', () => {
    const messages = [{ de: 'contact' as const, texte: 'Gratuit · ★ 4,6 · 1 million de téléchargements' }]
    const w = monter(page('Magasin d’applis', { url: undefined, messages }))
    expect(w.find('[data-marque="navigateur"]').exists()).toBe(false)
    const fiche = w.find('[data-marque="magasin"] .fiche-appli')
    expect(fiche.find('.titre-page').text()).toBe('Super Lampe')
    expect(fiche.find('.details').text()).toBe('★ 4,612+')
    expect(fiche.find('.age').text()).toBe('12+')
    expect(fiche.find('.obtenir').text()).toBe('Obtenir')
    expect(fiche.find('.obtenir').attributes('aria-hidden')).toBe('true')
    expect(onglets(w)).toEqual(['Aujourd’hui', 'Jeux', 'Recherche'])
    expect(w.findAll('.barre-onglets svg')).toHaveLength(3)
    expect(monter(page('Magasin d’applis', { url: undefined })).find('.details').text()).toBe('12+')
    expect(monter(page('Navigateur')).find('.fiche-appli').exists()).toBe(false)
  })

  it('BanqueNova (hors page web) : en-tête seul', () => {
    const coque = monter(conversation({ appNom: 'BanqueNova' })).find('[data-marque="banquenova"]')
    expect(coque.find('.entete-app').text()).toBe('BanqueNova')
    expect(coque.find('.barre-onglets').exists()).toBe(false)
  })

  it.each(['Mon Collège', 'Mon Lycée'])('%s : en-tête, menu décoratif Emploi du temps / Notes / Cahier de textes', (appNom) => {
    const w = monter(conversation({ appNom, contact: 'Vie scolaire' }))
    const menu = w.find('[data-marque="ent"] .menu')
    expect(w.find('[data-marque="ent"] .entete-app').text()).toBe(appNom)
    expect(menu.attributes('aria-hidden')).toBe('true')
    expect(menu.findAll('[data-rubrique]').map((r) => r.attributes('data-rubrique'))).toEqual(['Emploi du temps', 'Notes', 'Cahier de textes'])
  })

  it('Météo : température et icône du temps décoratives', () => {
    const temps = monter(conversation({ appNom: 'Météo' })).find('[data-marque="meteo"] .temps')
    expect(temps.text()).toMatch(/^14\s°C$/)
    expect(temps.attributes('aria-hidden')).toBe('true')
  })
})

const AUTRES_MARQUES = [
  ['StreamTube', 'streamtube', () => publication('StreamTube')],
  ['SnapTalk (publication)', 'snaptalk', () => publication('SnapTalk')],
  ['Mail', 'mail', () => mail()],
  ['Navigateur', 'navigateur', () => page('Navigateur')],
  ['Magasin d’applis', 'magasin', () => page('Magasin d’applis', { url: undefined })],
  ['BanqueNova', 'banquenova', () => conversation({ appNom: 'BanqueNova' })],
  ['Mon Collège', 'ent', () => conversation({ appNom: 'Mon Collège' })],
  ['Météo', 'meteo', () => conversation({ appNom: 'Météo' })],
] as const

describe('coques de marque : autres applis, accent et séquence', () => {
  it.each(AUTRES_MARQUES)('%s : accent du registre, aucun bouton, la séquence va jusqu’au verdict', async (_nom, marque, ecran) => {
    store.modifierReglages({ animations: false })
    const w = monter(ecran(), { choixJoue: null })
    const style = (w.find(`[data-marque="${marque}"]`).element as HTMLElement).style
    const a = appli(ecran().appNom)
    expect(style.getPropertyValue('--marque-accent')).toBe(a.accent)
    expect(style.getPropertyValue('--marque-texte')).toBe(a.texteSurAccent)
    expect(w.findAll('button')).toHaveLength(0)
    await w.setProps({ choixJoue: 'clic' })
    expect(w.find(`[data-marque="${marque}"] .choix-joue`).text()).toContain('Piège')
    expect(w.find('figure').attributes('data-verdict')).toBe('piege')
  })
})

describe('coques de marque : surlignage hors du corps', () => {
  const avec = (...passages: string[]) => ({ indices: passages.map((passage) => ({ libelle: passage, passage })), indiceVisible: true })
  const surlignes = (w: ReturnType<typeof monter>) => w.findAll('.passage').map((m) => m.element.lastChild?.textContent)

  it('publication : compte, abonnés, bio et média', () => {
    const ecran = publication('SnapTalk', { contact: 'InfoÉcIair', abonnes: '2 400', bio: 'Parodie, rien n’est vrai', media: { description: 'Sa bouche bouge en décalage' } } as Partial<Ecran>)
    const w = monter(ecran, avec('InfoÉcIair', '2 400 abonnés', 'Parodie', 'en décalage'))
    expect(surlignes(w)).toEqual(['InfoÉcIair', '2 400 abonnés', 'Parodie', 'en décalage'])
  })

  it('mail : objet et domaine de l’adresse, sans lien repéré dans l’adresse', () => {
    const w = monter(mail({ sujet: 'Ton compte sera supprimé dans 24 h' } as Partial<Ecran>), avec('supprimé dans 24 h', 'gamebox-verif.com'))
    expect(surlignes(w)).toEqual(['supprimé dans 24 h', 'gamebox-verif.com'])
    expect(w.find('.adresse .lien').exists()).toBe(false)
  })

  it('web : domaine de la barre d’adresse', () => {
    const w = monter(page('Navigateur'), avec('gare-libre-wifi.com'))
    expect(w.find('.barre-adresse .domaine .passage').exists()).toBe(true)
  })
})
