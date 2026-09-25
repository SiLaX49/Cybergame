// @vitest-environment node
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildContent } from '../../../scripts/build-content'
import { TRANCHES, type Mission } from '../../../src/content/schema'

const bundle = buildContent(join(process.cwd(), 'content'))
const missions = bundle.missions.filter((m) => m.type === 'mission')

const MARQUES_REELLES = [
  'snapchat', 'instagram', 'tiktok', 'roblox', 'robux', 'discord', 'fortnite', 'v-bucks', 'vinted', 'leboncoin',
  'la poste', 'colissimo', 'chronopost', 'amazon', 'whatsapp', 'facebook', 'youtube', 'paypal', 'iphone',
  'playstation', 'xbox', 'nintendo', 'telegram',
]

function textesDesFauxEcrans(m: Mission): string[] {
  return m.etapes.flatMap((e) => {
    if (e.type === 'scenario') {
      const { appNom, contact, sujet, url, messages } = e.ecran
      return [appNom, contact, sujet ?? '', url ?? '', ...messages.flatMap((x) => [x.texte, x.texteSimple ?? ''])]
    }
    if (e.type === 'fil') return e.notifications.flatMap((n) => [n.appNom, n.de, n.texte])
    if (e.jeu === 'tri') return e.config.cartes.map((c) => c.texte)
    return [e.config.titre, ...e.config.lignes.map((l) => l.texte)]
  })
}

const missionsDuTheme = (theme: string) => missions.filter((m) => m.theme === theme)

describe('contenu réel', () => {
  it.each(bundle.missions.map((m) => [m.id, m] as const))('%s : aucune marque réelle dans les faux écrans', (_id, m) => {
    const texte = textesDesFauxEcrans(m).join(' ').toLowerCase()
    expect(MARQUES_REELLES.filter((marque) => new RegExp(`\\b${marque}\\b`).test(texte))).toEqual([])
  })

  it.each(missions.map((m) => [m.id, m] as const))('%s : 3 ou 4 scénarios et 1 mini-jeu', (_id, m) => {
    const scenarios = m.etapes.filter((e) => e.type === 'scenario')
    expect(scenarios.length).toBeGreaterThanOrEqual(3)
    expect(scenarios.length).toBeLessThanOrEqual(4)
    expect(m.etapes.filter((e) => e.type === 'minijeu')).toHaveLength(1)
    expect(scenarios.filter((s) => s.type === 'scenario' && s.recuperation).length).toBeGreaterThanOrEqual(2)
  })

  it.each(missions.filter((m) => m.tranches.includes('6e')).map((m) => [m.id, m] as const))(
    '%s (6e) : textes simplifiés présents',
    (_id, m) => {
      for (const e of m.etapes) {
        if (e.type !== 'scenario') continue
        expect(e.aRetenirSimple, `${e.id}.aRetenirSimple`).toBeTruthy()
        e.ecran.messages.forEach((msg, i) => expect(msg.texteSimple, `${e.id}.messages.${i}`).toBeTruthy())
        e.choix
          .filter((c) => c.qualite === 'risque')
          .forEach((c) => expect(c.consequenceSimple, `${e.id}.${c.id}`).toBeTruthy())
      }
    },
  )

  it.each(TRANCHES)('phishing : au moins une mission pour la tranche %s', (t) => {
    expect(missionsDuTheme('phishing').some((m) => m.tranches.includes(t))).toBe(true)
  })
})
