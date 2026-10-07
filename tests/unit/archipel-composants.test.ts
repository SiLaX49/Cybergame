import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { infoIle } from '@/archipel/archipel'
import IleDessin from '@/archipel/IleDessin.vue'
import IleLien from '@/archipel/IleLien.vue'
import Sacoche from '@/archipel/Sacoche.vue'
import { compteurIle, nomAccessibleIle } from '@/archipel/libelles'
import { creerStore, definirStore } from '@/store/useProgress'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

vi.mock('@/content', async () => (await import('./content-mock')).contentMock)

beforeEach(() => {
  definirStore(creerStore(new MemoryStorage()))
})

describe('nomAccessibleIle', () => {
  it('donne nom, compteur, objet et position', () => {
    expect(
      nomAccessibleIle({ nom: 'Île aux hameçons', objet: 'le bouclier', calme: false, ici: true,
        etat: { terminees: 3, total: 3, aParcours: true, objetGagne: true, complete: true } }),
    ).toBe('Île aux hameçons — 3 missions sur 3 terminées, le bouclier gagné, tu es ici')
  })
  it('île sans parcours et sans mission', () => {
    expect(
      nomAccessibleIle({ nom: 'Île des clés', objet: 'le coffre-fort', calme: false, ici: false,
        etat: { terminees: 0, total: 0, aParcours: false, objetGagne: false, complete: false } }),
    ).toBe('Île des clés — bientôt disponible')
  })
  it('île à parcours non terminé', () => {
    expect(
      nomAccessibleIle({ nom: 'Île des clés', objet: 'le coffre-fort', calme: false, ici: false,
        etat: { terminees: 1, total: 3, aParcours: true, objetGagne: false, complete: false } }),
    ).toBe('Île des clés — 1 mission sur 3 terminée, le coffre-fort à gagner')
  })
  it('île d’aventure avec missions mais sans parcours : « parcours bientôt »', () => {
    expect(
      nomAccessibleIle({ nom: 'Île des clés', objet: 'le coffre-fort', calme: false, ici: true,
        etat: { terminees: 1, total: 3, aParcours: false, objetGagne: false, complete: false } }),
    ).toBe('Île des clés — 1 mission sur 3 terminée, parcours bientôt, tu es ici')
  })
  it('île calme : jamais d’objet', () => {
    expect(
      nomAccessibleIle({ nom: 'Île du phare', objet: null, calme: true, ici: false,
        etat: { terminees: 0, total: 3, aParcours: false, objetGagne: false, complete: false } }),
    ).toBe('Île du phare — 0 mission sur 3 terminée')
  })
})

describe('IleLien', () => {
  it('lien vers la page de l’île, dessin et personnage décoratifs, drapeau en texte', async () => {
    const router = await routerTest('/carte')
    const w = mount(IleLien, {
      props: { theme: 'phishing', titreTheme: 'Hameçonnage', ici: true, personnage: 'p1',
        etat: { terminees: 3, total: 3, aParcours: true, objetGagne: true, complete: true } },
      global: { plugins: [router] },
    })
    const a = w.find('a.ile-lien')
    // historique mémoire des tests : pas de « # » (le vrai routeur, en hash, donne #/ile/phishing)
    expect(a.attributes('href')).toBe('/ile/phishing')
    expect(a.attributes('aria-label')).toContain('tu es ici')
    for (const svg of w.findAll('svg')) expect(svg.attributes('aria-hidden')).toBe('true')
    expect(w.find('.ile-etiquette').text()).toContain('3 / 3')
    expect(w.find('.ile-etiquette').text()).toContain('terminée')
  })
  it('île d’aventure sans parcours dans la tranche : « Parcours bientôt » visible et dans le nom', async () => {
    const router = await routerTest('/carte')
    const w = mount(IleLien, {
      props: { theme: 'comptes', titreTheme: 'Comptes', ici: false, personnage: null,
        etat: { terminees: 0, total: 2, aParcours: false, objetGagne: false, complete: false } },
      global: { plugins: [router] },
    })
    expect(w.find('.ile-etiquette').text()).toContain('Parcours bientôt')
    expect(w.find('a.ile-lien').attributes('aria-label')).toContain('parcours bientôt')
  })
  it('thème inconnu : le dessin ne rend rien (pas d’île par défaut)', () => {
    const w = mount(IleDessin, { props: { theme: 'inconnu' } })
    expect(w.find('svg').exists()).toBe(false)
  })
  it('infoIle : île à parcours seulement', () => {
    expect(infoIle('phishing')?.nom).toBe('Île aux hameçons')
    expect(infoIle('harcelement')).toBeUndefined()
    expect(infoIle('inconnu')).toBeUndefined()
  })
  it('île calme : pas d’objet ni de drapeau', async () => {
    const router = await routerTest('/carte')
    const w = mount(IleLien, {
      props: { theme: 'harcelement', titreTheme: 'Cyberharcèlement', ici: false, personnage: null,
        etat: { terminees: 2, total: 2, aParcours: false, objetGagne: false, complete: false } },
      global: { plugins: [router] },
    })
    expect(w.find('.ile-objet').exists()).toBe(false)
    expect(w.find('.ile-etiquette').text()).not.toContain('terminée')
  })
})

describe('Sacoche', () => {
  it('rien sans objet à gagner', () => {
    expect(mount(Sacoche, { props: { objets: [] } }).find('.sacoche').exists()).toBe(false)
  })
  it('dit en texte gagné ou pas encore', () => {
    const w = mount(Sacoche, { props: { objets: [
      { theme: 'phishing', emoji: '🛡️', nom: 'le bouclier', gagne: true },
      { theme: 'comptes', emoji: '🔐', nom: 'le coffre-fort', gagne: false },
    ] } })
    const items = w.findAll('li').map((l) => l.text())
    expect(items[0]).toContain('gagné')
    expect(items[1]).toContain('pas encore')
  })
})

describe('compteurIle', () => {
  const etat = (terminees: number, total: number) => ({ terminees, total, aParcours: false, objetGagne: false, complete: false })
  it('accorde « mission » selon le total', () => {
    expect(compteurIle(etat(0, 1))).toBe('0 / 1 mission')
    expect(compteurIle(etat(0, 2))).toBe('0 / 2 missions')
    expect(compteurIle(etat(0, 0))).toBe('Bientôt disponible')
  })
})
