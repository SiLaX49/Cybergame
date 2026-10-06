import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Ecran } from '@/content/schema'
import Telephone from '@/phone/Telephone.vue'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
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
