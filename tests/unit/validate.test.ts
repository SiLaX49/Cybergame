import { describe, expect, it } from 'vitest'
import { missionSchema } from '@/content/schema'
import { formatIssue, validateCross, zodIssues } from '@/content/validate'
import { missionFixture, themesFixture } from './fixtures'

describe('validateCross', () => {
  const themes = themesFixture()

  it('ne signale rien pour un contenu cohérent', () => {
    expect(validateCross(themes, [{ fichier: 'a.yaml', mission: missionFixture() }])).toEqual([])
  })

  it('signale un thème inconnu', () => {
    const issues = validateCross(themes, [{ fichier: 'a.yaml', mission: missionFixture({ theme: 'inconnu' }) }])
    expect(issues).toEqual([{ fichier: 'a.yaml', chemin: 'theme', message: 'thème inconnu : inconnu' }])
  })

  it('signale un identifiant de mission utilisé deux fois', () => {
    const issues = validateCross(themes, [
      { fichier: 'a.yaml', mission: missionFixture() },
      { fichier: 'b.yaml', mission: missionFixture() },
    ])
    expect(issues).toEqual([{ fichier: 'b.yaml', chemin: 'id', message: 'identifiant déjà utilisé dans a.yaml' }])
  })

  it('exige fiche.siRevelation pour un thème sensible', () => {
    const issues = validateCross(themes, [{ fichier: 'a.yaml', mission: missionFixture({ theme: 'harcelement' }) }])
    expect(issues).toEqual([
      { fichier: 'a.yaml', chemin: 'fiche.siRevelation', message: 'obligatoire pour un thème sensible' },
    ])
  })
})

describe('formatage des erreurs', () => {
  it('indique fichier, chemin et message', () => {
    const res = missionSchema.safeParse({})
    if (res.success) throw new Error('devrait échouer')
    const [premiere] = zodIssues('missions/x.yaml', res.error)
    expect(formatIssue(premiere!)).toMatch(/^missions\/x\.yaml › \S+ : .+/)
    expect(formatIssue({ fichier: 'f', chemin: '', message: 'm' })).toBe('f › (racine) : m')
  })
})
