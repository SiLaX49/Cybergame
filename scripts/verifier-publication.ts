import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parse } from 'yaml'
import { buildContent, estBrouillon, listContentFiles } from './build-content'

/** Identifiants des missions de thème sensible encore à relire : elles ne doivent jamais être publiées. */
export function idsABloquer(racineContenu: string): string[] {
  const bundle = buildContent(racineContenu, { brouillons: true })
  return bundle.missions.filter((m) => estBrouillon(m, bundle.themes)).map((m) => m.id)
}

/**
 * Seconde lecture, volontairement indépendante du schéma et de estBrouillon : le YAML brut.
 * Si les deux lectures divergent (par exemple idsABloquer vide par erreur), la vérification échoue.
 */
export function brouillonsSensiblesBruts(racineContenu: string): string[] {
  const [cheminThemes, , ...cheminsMissions] = listContentFiles(racineContenu)
  const themes = parse(readFileSync(cheminThemes!, 'utf8')) as { id?: unknown; sensible?: unknown }[]
  const sensibles = new Set(themes.filter((t) => t.sensible === true).map((t) => String(t.id)))
  return cheminsMissions
    .map((f) => parse(readFileSync(f, 'utf8')) as { id?: unknown; theme?: unknown; relecture?: { statut?: unknown } } | null)
    .filter((m) => typeof m?.theme === 'string' && sensibles.has(m.theme) && m.relecture?.statut === 'a-relire')
    .map((m) => String(m!.id))
    .sort()
}

/** Vérifie qu’aucun brouillon sensible n’est présent dans les fichiers JS publiés. */
export function verifierPublication(
  racineContenu: string,
  dossierAssets: string,
  lireIds: (racine: string) => string[] = idsABloquer,
): { ok: boolean; messages: string[] } {
  const ids = lireIds(racineContenu)
  const bruts = brouillonsSensiblesBruts(racineContenu)
  const oublies = bruts.filter((id) => !ids.includes(id))
  if (oublies.length) {
    return {
      ok: false,
      messages: [`Liste des brouillons incomplète (${ids.length} trouvé(s)) : ${oublies.join(', ')} encore à relire mais non bloqué(s).`],
    }
  }
  const fichiers = existsSync(dossierAssets)
    ? readdirSync(dossierAssets).filter((f) => f.endsWith('.js') && statSync(join(dossierAssets, f)).isFile())
    : []
  if (!fichiers.length) return { ok: false, messages: [`Aucun fichier JS dans ${dossierAssets} : lance d’abord le build de production.`] }
  const trouves = ids.flatMap((id) =>
    fichiers.filter((f) => readFileSync(join(dossierAssets, f), 'utf-8').includes(id)).map((f) => `${id} dans ${f}`),
  )
  if (trouves.length) return { ok: false, messages: ['Brouillons présents dans dist/ :', ...trouves.map((t) => `- ${t}`)] }
  return { ok: true, messages: [`Garde-fou de publication : aucun des ${ids.length} brouillon(s) sensible(s) n’est dans dist/.`] }
}

function main() {
  const racine = fileURLToPath(new URL('..', import.meta.url))
  const { ok, messages } = verifierPublication(join(racine, 'content'), join(racine, 'dist', 'assets'))
  if (!ok) {
    console.error(messages.join('\n'))
    process.exit(1)
  }
  console.log(messages.join('\n'))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
