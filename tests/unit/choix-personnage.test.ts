import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import ChoixPersonnage from '@/parcours/ChoixPersonnage.vue'
import { PERSONNAGES_INFO } from '@/parcours/personnages'
import { chargerProgression, STORAGE_KEY } from '@/store/progress'
import { creerStore, definirStore, type ProgressStore } from '@/store/useProgress'
import ReglagesPanel from '@/ui/ReglagesPanel.vue'
import { MemoryStorage } from './memory-storage'

let store: ProgressStore
beforeEach(() => {
  store = creerStore(new MemoryStorage())
  definirStore(store)
})

describe('personnage', () => {
  it('une progression enregistrée sans personnage se charge, avec personnage = null', () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tranche: '6e' }))
    expect(chargerProgression(storage).personnage).toBeNull()
  })

  it('le store mémorise le personnage choisi', () => {
    store.choisirPersonnage('p3')
    expect(store.etat.personnage).toBe('p3')
  })

  it('ChoixPersonnage : 4 choix décrits en texte, sélection émise', async () => {
    const w = mount(ChoixPersonnage, { props: { modelValue: null } })
    expect(w.find('legend').text()).toBe('Choisis ton personnage')
    const radios = w.findAll('input[type="radio"][name="personnage"]')
    expect(radios).toHaveLength(4)
    expect(w.text()).toContain(PERSONNAGES_INFO.p1.libelle)
    expect(w.find('svg').attributes('aria-hidden')).toBe('true')
    await radios[1]!.setValue()
    expect(w.emitted('update:modelValue')).toEqual([['p2']])
  })

  it('ChoixPersonnage reflète la valeur courante', () => {
    const w = mount(ChoixPersonnage, { props: { modelValue: 'p4' } })
    expect((w.find('input[value="p4"]').element as HTMLInputElement).checked).toBe(true)
  })

  it('le panneau des réglages permet de changer de personnage', async () => {
    const w = mount(ReglagesPanel)
    expect(w.text()).toContain('Personnage des parcours')
    await w.find('input[name="personnage-reglages"][value="p2"]').setValue()
    expect(store.etat.personnage).toBe('p2')
  })
})
