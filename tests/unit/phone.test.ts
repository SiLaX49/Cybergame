import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Scenario } from '@/content/schema'
import EcranTelephone from '@/phone/EcranTelephone.vue'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import { MemoryStorage } from './memory-storage'

let store: ProgressStore
beforeEach(() => {
  store = creerStore(new MemoryStorage())
  definirStore(store)
})

const ecran = (surcharge: Partial<Scenario['ecran']>): Scenario['ecran'] => ({
  app: 'sms',
  appNom: 'Messages',
  contact: 'Colis Express',
  messages: [
    { de: 'contact', texte: 'Payez 1,99 €', texteSimple: 'Paie 1,99 €' },
    { de: 'moi', texte: 'C’est quoi ?' },
  ],
  ...surcharge,
})

describe('EcranTelephone', () => {
  it('affiche une conversation avec qui parle', () => {
    const w = mount(EcranTelephone, { props: { ecran: ecran({}) } })
    expect(w.find('figure').attributes('aria-label')).toBe('Écran de téléphone : Messages')
    const bulles = w.findAll('li.bulle')
    expect(bulles).toHaveLength(2)
    expect(bulles[0]!.text()).toBe('Colis Express : Payez 1,99 €')
    expect(bulles[1]!.text()).toBe('Toi : C’est quoi ?')
  })

  it('la zone défilante de l’écran est atteignable au clavier', () => {
    const w = mount(EcranTelephone, { props: { ecran: ecran({}) } })
    const zone = w.find('.ecran')
    expect(zone.attributes('tabindex')).toBe('0')
    expect(zone.attributes('role')).toBe('region')
    expect(zone.attributes('aria-label')).toBe('Contenu de l’écran : Messages')
  })

  it('affiche un mail avec expéditeur et objet', () => {
    const w = mount(EcranTelephone, { props: { ecran: ecran({ app: 'mail', sujet: 'Compte suspendu' }) } })
    expect(w.text()).toContain('De : Colis Express')
    expect(w.text()).toContain('Objet : Compte suspendu')
  })

  it('affiche l’adresse d’une page web', () => {
    const w = mount(EcranTelephone, { props: { ecran: ecran({ app: 'web', url: 'colis-expres.info/payer' }) } })
    expect(w.find('.barre-adresse').text()).toContain('colis-expres.info/payer')
  })

  it('utilise le texte simplifié si le réglage est actif', async () => {
    store.modifierReglages({ lectureSimple: true })
    const w = mount(EcranTelephone, { props: { ecran: ecran({}) } })
    expect(w.findAll('li.bulle')[0]!.text()).toContain('Paie 1,99 €')
  })
})
