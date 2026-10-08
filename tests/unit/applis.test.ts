// @vitest-environment node
import bundle from 'virtual:content'
import { describe, expect, it } from 'vitest'
import { scenarioSchema } from '@/content/schema'
import { APPLIS, NOMS_APPLIS, appli } from '@/phone/applis'
import { rawScenario } from './fixtures'

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

/** Tous les `appNom` du contenu réel : faux écrans, fils de notifications, réglages de confidentialité. */
const nomsDuContenu = [
  ...new Set(
    bundle.missions.flatMap((m) =>
      m.etapes.flatMap((e) => {
        if (e.type === 'scenario') return [e.ecran.appNom]
        if (e.type === 'fil') return e.notifications.map((n) => n.appNom)
        if (e.type === 'minijeu' && e.jeu === 'confidentialite') return [e.config.appNom]
        return []
      }),
    ),
  ),
]

describe('registre des applis', () => {
  it.each(Object.values(APPLIS).map((a) => [a.nom, a] as const))('%s : texte sur l’accent à 4.5:1 au moins', (_nom, a) => {
    expect(contraste(a.texteSurAccent, a.accent)).toBeGreaterThanOrEqual(4.5)
  })

  it('chaque clé est le nom de son appli', () => {
    for (const [cle, a] of Object.entries(APPLIS)) expect(a.nom).toBe(cle)
    expect(NOMS_APPLIS).toEqual(Object.keys(APPLIS))
  })

  it('chaque appNom du contenu réel est une clé du registre', () => {
    expect(nomsDuContenu.length).toBeGreaterThan(0)
    expect(nomsDuContenu.filter((nom) => !(nom in APPLIS))).toEqual([])
  })

  it('appli() lève une erreur pour un nom inconnu', () => {
    expect(appli('Magasin d’applis').marque).toBe('magasin')
    expect(() => appli('Snapchat')).toThrow()
  })

  it('le schéma refuse une appli hors registre', () => {
    const scenario = rawScenario()
    expect(scenarioSchema.safeParse(scenario).success).toBe(true)
    expect(scenarioSchema.safeParse({ ...scenario, ecran: { ...scenario.ecran, appNom: 'Snapchat' } }).success).toBe(false)
  })
})
