import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parse } from 'yaml'
import { missionSchema, themesFileSchema, type ContentBundle, type Mission } from '../src/content/schema'
import { formatIssue, validateCross, zodIssues, type ContentIssue } from '../src/content/validate'

export class ContentError extends Error {
  constructor(public readonly issues: ContentIssue[]) {
    super(`Contenu invalide (${issues.length} problème(s)) :\n${issues.map((i) => `  - ${formatIssue(i)}`).join('\n')}`)
    this.name = 'ContentError'
  }
}

function listerYaml(dossier: string): string[] {
  return readdirSync(dossier)
    .sort()
    .flatMap((nom) => {
      const chemin = join(dossier, nom)
      if (statSync(chemin).isDirectory()) return listerYaml(chemin)
      return /\.ya?ml$/.test(nom) ? [chemin] : []
    })
}

export function listContentFiles(racine: string): string[] {
  const missions = join(racine, 'missions')
  return [join(racine, 'themes.yaml'), ...(existsSync(missions) ? listerYaml(missions) : [])]
}

const nomRelatif = (racine: string, chemin: string) => relative(racine, chemin).replaceAll('\\', '/')

function lireYaml(racine: string, chemin: string, issues: ContentIssue[]): { ok: true; data: unknown } | { ok: false } {
  try {
    return { ok: true, data: parse(readFileSync(chemin, 'utf8')) }
  } catch (e) {
    issues.push({ fichier: nomRelatif(racine, chemin), chemin: '', message: `YAML illisible : ${(e as Error).message}` })
    return { ok: false }
  }
}

export function buildContent(racine: string, maintenant: Date = new Date()): ContentBundle {
  const issues: ContentIssue[] = []
  const [cheminThemes, ...cheminsMissions] = listContentFiles(racine)

  let themes: ContentBundle['themes'] = []
  const lecture = lireYaml(racine, cheminThemes!, issues)
  if (lecture.ok) {
    const res = themesFileSchema.safeParse(lecture.data)
    if (res.success) themes = res.data
    else issues.push(...zodIssues('themes.yaml', res.error))
  }

  const missions: { fichier: string; mission: Mission }[] = []
  for (const chemin of cheminsMissions) {
    const fichier = nomRelatif(racine, chemin)
    const brut = lireYaml(racine, chemin, issues)
    if (!brut.ok) continue
    const res = missionSchema.safeParse(brut.data)
    if (res.success) missions.push({ fichier, mission: res.data })
    else issues.push(...zodIssues(fichier, res.error))
  }

  if (themes.length) issues.push(...validateCross(themes, missions))
  if (issues.length) throw new ContentError(issues)
  return { generatedAt: maintenant.toISOString(), themes, missions: missions.map((m) => m.mission) }
}
