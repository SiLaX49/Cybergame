import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ConfidentialitePage from '@/pages/ConfidentialitePage.vue'
import EnseignantsPage from '@/pages/EnseignantsPage.vue'
import FicheMissionPage from '@/pages/FicheMissionPage.vue'
import PlanBPage from '@/pages/PlanBPage.vue'
import TestTechniquePage from '@/pages/TestTechniquePage.vue'
import { verifierPoste, type EnvPoste } from '@/pages/testTechnique'
import { creerStore, definirStore } from '@/store/useProgress'
import { cliquer } from './helpers'
import { MemoryStorage } from './memory-storage'
import { routerTest } from './router-test'

vi.mock('@/content', async () => (await import('./content-mock')).contentMock)

beforeEach(() => definirStore(creerStore(new MemoryStorage())))

const monter = async (composant: Parameters<typeof mount>[0], chemin: string) =>
  mount(composant, { global: { plugins: [await routerTest(chemin)] } })

describe('verifierPoste', () => {
  const ok: EnvPoste = { stockage: true, serviceWorker: true, horsLigneActif: true, largeur: 1024, nbMissions: 9 }

  it('déclare le poste prêt quand tout va bien', () => {
    expect(verifierPoste(ok).pret).toBe(true)
  })
  it('reste prêt sans stockage ni hors ligne (non bloquants)', () => {
    const r = verifierPoste({ ...ok, stockage: false, serviceWorker: false, horsLigneActif: false })
    expect(r.pret).toBe(true)
    expect(r.verifs.find((v) => v.id === 'hors-ligne')?.conseil).toContain('il faudra rester connecté')
  })
  it('n’est pas prêt si l’écran est trop étroit ou le contenu absent', () => {
    expect(verifierPoste({ ...ok, largeur: 300 }).pret).toBe(false)
    expect(verifierPoste({ ...ok, nbMissions: 0 }).pret).toBe(false)
  })
})

describe('EnseignantsPage', () => {
  it('liste et filtre les missions, affiche la date de mise à jour', async () => {
    const w = await monter(EnseignantsPage, '/enseignants')
    expect(w.findAll('tbody tr')).toHaveLength(3)
    expect(w.text()).toContain('1 septembre 2026')
    await w.find('select#filtre-theme').setValue('harcelement')
    expect(w.findAll('tbody tr')).toHaveLength(1)
    expect(w.find('tbody').text()).toContain('Mission sensible')
    await w.find('select#filtre-theme').setValue('')
    await w.find('select#filtre-tranche').setValue('lycee')
    expect(w.text()).toContain('Aucune mission ne correspond à ces filtres.')
  })
})

describe('FicheMissionPage', () => {
  it('affiche la conduite à tenir et les aides d’un thème sensible, et imprime', async () => {
    const imprimer = vi.spyOn(window, 'print').mockImplementation(() => {})
    const w = await monter(FicheMissionPage, '/enseignants/m-sensible')
    expect(w.find('h1').text()).toBe('Mission sensible')
    expect(w.text()).toContain('Prévenir le ou la CPE')
    expect(w.text()).toContain('3018')
    expect(w.text()).toContain('4.1')
    await cliquer(w, 'Imprimer la fiche')
    expect(imprimer).toHaveBeenCalled()
  })

  it('liste les leviers travaillés avec leur question de débrief', async () => {
    const w = await monter(FicheMissionPage, '/enseignants/m-test')
    expect(w.text()).toContain('Leviers travaillés')
    expect(w.text()).toContain('Il fallait faire vite : Question Il fallait faire vite ?')
  })
})

describe('PlanBPage', () => {
  it('produit une version papier avec corrigé', async () => {
    const w = await monter(PlanBPage, '/enseignants/m-test/plan-b')
    expect(w.text()).toContain('☐ Je clique et je paie')
    expect(w.text()).toContain('Corrigé (pour l’adulte)')
    expect(w.text()).toContain('Vrais indices : L’adresse est bizarre / On me presse')
    expect(w.findAll('table tbody tr')).toHaveLength(4)
  })

  it('ajoute la question « pourquoi » et son corrigé', async () => {
    const w = await monter(PlanBPage, '/enseignants/m-test/plan-b')
    expect(w.text()).toContain('Si tu as choisi le piège, pourquoi ?')
    expect(w.text()).toContain('☐ Il fallait faire vite')
    expect(w.text()).toContain('☐ Autre chose / je ne sais pas')
    expect(w.text()).toContain('Le délai de 24 h est là exprès.')
  })
})

describe('ConfidentialitePage et TestTechniquePage', () => {
  it('explique les données et permet d’effacer', async () => {
    const w = await monter(ConfidentialitePage, '/confidentialite')
    expect(w.text()).toContain('Rien n’est envoyé sur Internet')
    expect(w.text()).toContain('Effacer ma progression')
  })
  it('affiche les 4 vérifications', async () => {
    const w = await monter(TestTechniquePage, '/test')
    expect(w.findAll('li.verif')).toHaveLength(4)
  })
})
