import { describe, expect, it } from 'vitest'
import {
  confidentialiteConfigSchema,
  missionSchema,
  motdepasseConfigSchema,
  permissionsConfigSchema,
  verificationConfigSchema,
} from '@/content/schema'
import { rawConfidentialite, rawMission, rawMotdepasse, rawPermissions, rawScenario, rawVerification } from './fixtures'

const messages = (res: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  res.success ? [] : res.error!.issues.map((i) => `${i.path.join('.')} : ${i.message}`)

describe('configs des nouveaux mini-jeux', () => {
  it('acceptent les fixtures', () => {
    expect(motdepasseConfigSchema.safeParse(rawMotdepasse()).success).toBe(true)
    expect(confidentialiteConfigSchema.safeParse(rawConfidentialite()).success).toBe(true)
    expect(verificationConfigSchema.safeParse(rawVerification()).success).toBe(true)
    expect(permissionsConfigSchema.safeParse(rawPermissions()).success).toBe(true)
  })

  it('motdepasse : objectif connu, interdits facultatifs', () => {
    expect(motdepasseConfigSchema.safeParse({ ...rawMotdepasse(), objectif: 'moyen' }).success).toBe(false)
    const sans: Record<string, unknown> = rawMotdepasse()
    delete sans.interdits
    expect(motdepasseConfigSchema.parse(sans).interdits).toEqual([])
  })

  it('confidentialite : options existantes et au moins un réglage à changer', () => {
    const inconnu = rawConfidentialite()
    inconnu.reglages[0]!.conseille = 'personne'
    expect(messages(confidentialiteConfigSchema.safeParse(inconnu))).toContain('reglages.0.conseille : option inconnue : personne')
    const rienAChanger = rawConfidentialite()
    rienAChanger.reglages.forEach((r) => (r.initial = r.conseille))
    expect(messages(confidentialiteConfigSchema.safeParse(rienAChanger))).toContain(
      'reglages : au moins un réglage doit être à changer (initial différent du conseillé)',
    )
  })

  it('verification : 2 à 5 actions, verdict connu', () => {
    const une = rawVerification()
    une.actions = une.actions.slice(0, 1)
    expect(verificationConfigSchema.safeParse(une).success).toBe(false)
    expect(verificationConfigSchema.safeParse({ ...rawVerification(), verdict: 'peut-etre' }).success).toBe(false)
  })

  it('permissions : identifiants uniques', () => {
    const doublon = rawPermissions()
    doublon.apps[1]!.id = 'lampe'
    expect(messages(permissionsConfigSchema.safeParse(doublon))).toContain('apps.1.id : appli en double : lampe')
  })

  it('une mission peut utiliser chaque nouveau mini-jeu', () => {
    for (const [jeu, config] of [
      ['motdepasse', rawMotdepasse()],
      ['confidentialite', rawConfidentialite()],
      ['verification', rawVerification()],
      ['permissions', rawPermissions()],
    ] as const) {
      const m = rawMission({ etapes: [rawScenario('sc-1'), { type: 'minijeu', id: 'mj-1', jeu, config }] })
      expect(missionSchema.safeParse(m).success, jeu).toBe(true)
    }
  })
})
