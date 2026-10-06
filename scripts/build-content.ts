import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parse } from 'yaml'
import { leviersFileSchema, missionSchema, themesFileSchema, type ContentBundle, type Leviers, type Mission, type Theme } from '../src/content/schema'
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
  return [join(racine, 'themes.yaml'), join(racine, 'leviers.yaml'), ...(existsSync(missions) ? listerYaml(missions) : [])]
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

/** Mission d’un thème sensible pas encore relue : exclue du build de production. */
export function estBrouillon(mission: Mission, themes: Theme[]): boolean {
  const theme = themes.find((t) => t.id === mission.theme)
  return !!theme?.sensible && mission.relecture?.statut === 'a-relire'
}

export interface BuildOptions {
  maintenant?: Date
  /** Garde les brouillons (défaut : oui). Le build de déploiement passe false. */
  brouillons?: boolean
}

export function buildContent(racine: string, { maintenant = new Date(), brouillons = true }: BuildOptions = {}): ContentBundle {
  const issues: ContentIssue[] = []
  const [cheminThemes, cheminLeviers, ...cheminsMissions] = listContentFiles(racine)

  let themes: ContentBundle['themes'] = []
  const lecture = lireYaml(racine, cheminThemes!, issues)
  if (lecture.ok) {
    const res = themesFileSchema.safeParse(lecture.data)
    if (res.success) themes = res.data
    else issues.push(...zodIssues('themes.yaml', res.error))
  }

  let leviers: Leviers | null = null
  const lectureLeviers = lireYaml(racine, cheminLeviers!, issues)
  if (lectureLeviers.ok) {
    const res = leviersFileSchema.safeParse(lectureLeviers.data)
    if (res.success) leviers = res.data
    else issues.push(...zodIssues('leviers.yaml', res.error))
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
  return { generatedAt: maintenant.toISOString(), themes, leviers: leviers!, missions: missions.map((m) => m.mission).filter((m) => brouillons || !estBrouillon(m, themes)) }
}
