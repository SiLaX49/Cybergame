// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { stringify } from 'yaml'
import { buildContent, ContentError, listContentFiles } from '../../../scripts/build-content'
import { rawLeviers, rawMission, rawThemes } from '../fixtures'

function dossier(missions: Record<string, string>, themes = stringify(rawThemes())) {
  const racine = mkdtempSync(join(tmpdir(), 'cr-contenu-'))
  writeFileSync(join(racine, 'themes.yaml'), themes)
  writeFileSync(join(racine, 'leviers.yaml'), stringify(rawLeviers()))
  for (const [chemin, texte] of Object.entries(missions)) {
    const complet = join(racine, 'missions', chemin)
    mkdirSync(join(complet, '..'), { recursive: true })
    writeFileSync(complet, texte)
  }
  return racine
}

function erreur(fn: () => unknown): ContentError {
  try {
    fn()
  } catch (e) {
    if (e instanceof ContentError) return e
    throw e
  }
  throw new Error('aucune erreur levée')
}

describe('buildContent', () => {
  it('compile un dossier valide', () => {
    const racine = dossier({ 'phishing/m.yaml': stringify(rawMission()) })
    const bundle = buildContent(racine, new Date('2026-09-01T10:00:00Z'))
    expect(bundle.generatedAt).toBe('2026-09-01T10:00:00.000Z')
    expect(bundle.themes.map((t) => t.id)).toEqual(['phishing', 'jeux-achats', 'harcelement'])
    expect(bundle.missions.map((m) => m.id)).toEqual(['m-test'])
  })

  it('rejette une mission invalide en indiquant fichier et champ', () => {
    const m = rawMission()
    ;(m.etapes[0] as { choix: unknown[] }).choix = []
    const racine = dossier({ 'phishing/m.yaml': stringify(m) })
    const e = erreur(() => buildContent(racine))
    expect(e.message).toContain('missions/phishing/m.yaml › etapes.0.choix')
  })

  it('signale un YAML illisible', () => {
    const racine = dossier({ 'phishing/m.yaml': 'id: [pas fermé' })
    expect(erreur(() => buildContent(racine)).message).toContain('YAML illisible')
  })

  it('applique les règles inter-fichiers', () => {
    const racine = dossier({ 'x/m.yaml': stringify(rawMission({ theme: 'inconnu' })) })
    expect(erreur(() => buildContent(racine)).message).toContain('thème inconnu : inconnu')
  })

  it('liste themes.yaml et tous les YAML des missions', () => {
    const racine = dossier({ 'a/m1.yaml': stringify(rawMission()), 'b/m2.yml': 'x: 1', 'b/notes.txt': 'rien' })
    const fichiers = listContentFiles(racine).map((f) => f.slice(racine.length + 1).replaceAll('\\', '/'))
    expect(fichiers).toEqual(['themes.yaml', 'leviers.yaml', 'missions/a/m1.yaml', 'missions/b/m2.yml'])
  })

  it('exige leviers.yaml', () => {
    const racine = dossier({ 'phishing/m.yaml': stringify(rawMission()) })
    rmSync(join(racine, 'leviers.yaml'))
    expect(erreur(() => buildContent(racine)).message).toContain('leviers.yaml')
  })

  it('expose les leviers dans le bundle', () => {
    const racine = dossier({ 'phishing/m.yaml': stringify(rawMission()) })
    expect(buildContent(racine).leviers.autre.libelle).toBe('Autre chose / je ne sais pas')
  })

  it('compile le vrai dossier content/', () => {
    const bundle = buildContent(join(process.cwd(), 'content'))
    expect(bundle.themes).toHaveLength(8)
  })
})
