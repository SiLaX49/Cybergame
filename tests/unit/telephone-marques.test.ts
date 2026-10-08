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
