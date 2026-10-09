// @vitest-environment node
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse, stringify } from 'yaml'
import { buildContent } from '../../../scripts/build-content'
import { brouillonsSensiblesBruts, idsABloquer, verifierPublication } from '../../../scripts/verifier-publication'
import { rawLeviers, rawMission, rawMissionSensible, rawThemes } from '../fixtures'

const CONTENU = join(process.cwd(), 'content')

/** Lecture indépendante du moteur : YAML brut, sans schéma ni buildContent. */
function brouillonsLusAPart(racine: string): string[] {
  const themes = parse(readFileSync(join(racine, 'themes.yaml'), 'utf8')) as { id: string; sensible?: boolean }[]
  const sensibles = new Set(themes.filter((t) => t.sensible === true).map((t) => t.id))
  const fichiers = (dossier: string): string[] =>
    readdirSync(dossier).flatMap((n) => {
      const p = join(dossier, n)
      return statSync(p).isDirectory() ? fichiers(p) : /\.ya?ml$/.test(n) ? [p] : []
    })
  return fichiers(join(racine, 'missions'))
    .map((f) => parse(readFileSync(f, 'utf8')) as { id: string; theme?: string; relecture?: { statut?: string } })
    .filter((m) => !!m.theme && sensibles.has(m.theme) && m.relecture?.statut === 'a-relire')
    .map((m) => m.id)
    .sort()
}

function dossierContenu(missions: Record<string, unknown>) {
  const racine = mkdtempSync(join(tmpdir(), 'cr-publication-'))
  writeFileSync(join(racine, 'themes.yaml'), stringify(rawThemes()))
  writeFileSync(join(racine, 'leviers.yaml'), stringify(rawLeviers()))
  for (const [chemin, m] of Object.entries(missions)) {
    mkdirSync(join(racine, 'missions', chemin, '..'), { recursive: true })
    writeFileSync(join(racine, 'missions', chemin), stringify(m))
  }
  return racine
}

function dossierAssets(fichiers: Record<string, string>) {
  const dossier = mkdtempSync(join(tmpdir(), 'cr-dist-'))
  for (const [nom, texte] of Object.entries(fichiers)) writeFileSync(join(dossier, nom), texte)
  return dossier
}

describe('garde-fou de publication (contenu réel)', () => {
  it('le build de production ne contient aucune mission sensible à relire', () => {
    const prod = buildContent(CONTENU, { brouillons: false })
    const sensibles = new Set(prod.themes.filter((t) => t.sensible).map((t) => t.id))
    const fuites = prod.missions.filter((m) => m.theme && sensibles.has(m.theme) && m.relecture?.statut === 'a-relire')
    expect(fuites.map((m) => m.id)).toEqual([])
  })

  it('idsABloquer correspond aux missions sensibles « a-relire » lues à part dans les YAML', () => {
    const attendus = brouillonsLusAPart(CONTENU)
    expect(attendus.length).toBeGreaterThan(0)
    expect([...idsABloquer(CONTENU)].sort()).toEqual(attendus)
    expect(brouillonsSensiblesBruts(CONTENU)).toEqual(attendus)
  })
})

describe('verifierPublication', () => {
  const racine = () => dossierContenu({ 'harcelement/s.yaml': rawMissionSensible(), 'phishing/m.yaml': rawMission() })

  it('passe quand aucun brouillon n’est dans les fichiers publiés', () => {
    const r = verifierPublication(racine(), dossierAssets({ 'index.js': 'm-test' }))
    expect(r.ok).toBe(true)
    expect(r.messages.join('\n')).toContain('aucun des 1 brouillon(s)')
  })

  it('échoue si un brouillon est dans les fichiers publiés', () => {
    const r = verifierPublication(racine(), dossierAssets({ 'index.js': '"m-sensible"' }))
    expect(r.ok).toBe(false)
    expect(r.messages.join('\n')).toContain('m-sensible dans index.js')
  })

  it('échoue si la liste des brouillons est vide alors qu’une mission sensible est à relire', () => {
    const r = verifierPublication(racine(), dossierAssets({ 'index.js': 'rien' }), () => [])
    expect(r.ok).toBe(false)
    expect(r.messages.join('\n')).toContain('m-sensible')
  })

  it('échoue sans fichier JS publié', () => {
    expect(verifierPublication(racine(), dossierAssets({})).ok).toBe(false)
  })
})
