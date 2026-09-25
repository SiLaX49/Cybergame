import type { z } from 'zod'
import type { Mission, Theme } from './schema'

export interface ContentIssue {
  fichier: string
  chemin: string
  message: string
}

export function formatIssue(issue: ContentIssue): string {
  return `${issue.fichier} › ${issue.chemin || '(racine)'} : ${issue.message}`
}

export function zodIssues(fichier: string, error: z.ZodError): ContentIssue[] {
  return error.issues.map((i) => ({ fichier, chemin: i.path.map(String).join('.'), message: i.message }))
}

export function validateCross(themes: Theme[], missions: { fichier: string; mission: Mission }[]): ContentIssue[] {
  const issues: ContentIssue[] = []
  const themesParId = new Map(themes.map((t) => [t.id, t]))
  const fichierParId = new Map<string, string>()

  for (const { fichier, mission } of missions) {
    const autre = fichierParId.get(mission.id)
    if (autre) issues.push({ fichier, chemin: 'id', message: `identifiant déjà utilisé dans ${autre}` })
    else fichierParId.set(mission.id, fichier)

    if (mission.theme && !themesParId.has(mission.theme)) {
      issues.push({ fichier, chemin: 'theme', message: `thème inconnu : ${mission.theme}` })
    }
    mission.themesCouverts?.forEach((id, i) => {
      if (!themesParId.has(id)) issues.push({ fichier, chemin: `themesCouverts.${i}`, message: `thème inconnu : ${id}` })
    })
    const theme = mission.theme ? themesParId.get(mission.theme) : undefined
    if (theme?.sensible && !mission.fiche.siRevelation) {
      issues.push({ fichier, chemin: 'fiche.siRevelation', message: 'obligatoire pour un thème sensible' })
    }
  }
  return issues
}
