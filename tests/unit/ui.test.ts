import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import AppHeader from '@/ui/AppHeader.vue'
import BandeauAide from '@/ui/BandeauAide.vue'
import EffacerProgression from '@/ui/EffacerProgression.vue'
import ReglagesPanel from '@/ui/ReglagesPanel.vue'
import { appliquerReglages } from '@/ui/appliquerReglages'
import { useTexte } from '@/ui/useTexte'
import { themesFixture } from './fixtures'
import { cliquer } from './helpers'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

let store: ProgressStore
beforeEach(() => {
  store = creerStore(new MemoryStorage())
  definirStore(store)
})

describe('appliquerReglages', () => {
  it('reflète réglages et mode sur l’élément racine', async () => {
    const racine = document.createElement('div')
    appliquerReglages(store, racine)
    expect(racine.dataset.taille).toBe('normal')
    expect(racine.dataset.animations).toBe('on')
    expect(racine.dataset.mode).toBe('solo')
    store.modifierReglages({ taille: 'tres-grand', interligne: 'large', animations: false })
    store.choisirMode('classe')
    await nextTick()
    expect(racine.dataset.taille).toBe('tres-grand')
    expect(racine.dataset.interligne).toBe('large')
    expect(racine.dataset.animations).toBe('off')
    expect(racine.dataset.mode).toBe('classe')
  })
})

describe('useTexte', () => {
  it('utilise le texte simplifié seulement si le réglage est actif et le texte existe', () => {
    const t = useTexte()
    expect(t('long', 'court')).toBe('long')
    store.modifierReglages({ lectureSimple: true })
    expect(t('long', 'court')).toBe('court')
    expect(t('long')).toBe('long')
  })
})

describe('BandeauAide', () => {
  it('affiche les numéros et distingue les types d’aide', () => {
    const aides = themesFixture().find((t) => t.id === 'harcelement')!.aides
    const w = mount(BandeauAide, { props: { aides } })
    expect(w.text()).toContain('3018')
    expect(w.text()).toContain('Parler à quelqu’un')
    expect(w.find('aside').attributes('aria-label')).toBe('Besoin d’aide ?')
  })
})

describe('ReglagesPanel', () => {
  it('modifie les réglages du store', async () => {
    const w = mount(ReglagesPanel)
    await w.find('input[name="taille"][value="grand"]').setValue()
    await w.find('input[name="lecture-simple"]').setValue(true)
    await w.find('input[name="chrono"]').setValue(true)
    expect(store.etat.reglages).toMatchObject({ taille: 'grand', lectureSimple: true, chrono: true })
    await cliquer(w, 'Fermer')
    expect(w.emitted('fermer')).toHaveLength(1)
  })
})

describe('EffacerProgression', () => {
  it('demande confirmation avant d’effacer', async () => {
    store.choisirTranche('6e')
    const w = mount(EffacerProgression)
    await cliquer(w, 'Effacer ma progression')
    expect(store.etat.tranche).toBe('6e')
    await cliquer(w, 'Oui, tout effacer')
    expect(store.etat.tranche).toBeNull()
    expect(w.text()).toContain('Ta progression a été effacée.')
  })
})

describe('AppHeader', () => {
  it('ouvre et ferme le panneau de réglages', async () => {
    const router = await routerTest('/')
    const w = mount(AppHeader, { global: { plugins: [router] } })
    expect(w.find('#panneau-reglages').exists()).toBe(false)
    await cliquer(w, 'Réglages')
    expect(w.find('#panneau-reglages').exists()).toBe(true)
    expect(w.find('button[aria-controls="panneau-reglages"]').attributes('aria-expanded')).toBe('true')
  })
})
