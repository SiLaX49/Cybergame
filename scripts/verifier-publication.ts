import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { buildContent } from './build-content'

/** Identifiants des missions de thème sensible encore à relire : elles ne doivent jamais être publiées. */
export function idsABloquer(racineContenu: string): string[] {
  const bundle = buildContent(racineContenu, { brouillons: true })
  const sensibles = new Set(bundle.themes.filter((t) => t.sensible).map((t) => t.id))
  return bundle.missions.filter((m) => m.theme && sensibles.has(m.theme) && m.relecture?.statut === 'a-relire').map((m) => m.id)
}

function main() {
  const racine = fileURLToPath(new URL('..', import.meta.url))
  const ids = idsABloquer(join(racine, 'content'))
  const dossier = join(racine, 'dist', 'assets')
  const fichiers = readdirSync(dossier).filter((f) => f.endsWith('.js'))
  if (!fichiers.length) {
    console.error('Aucun fichier JS dans dist/assets : lance d’abord le build de production.')
    process.exit(1)
  }
  const trouves = ids.flatMap((id) => fichiers.filter((f) => readFileSync(join(dossier, f), 'utf-8').includes(id)).map((f) => `${id} dans ${f}`))
  if (trouves.length) {
    console.error('Brouillons présents dans dist/ :\n' + trouves.map((t) => `- ${t}`).join('\n'))
    process.exit(1)
  }
  console.log(`Garde-fou de publication : aucun des ${ids.length} brouillon(s) sensible(s) n’est dans dist/.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
