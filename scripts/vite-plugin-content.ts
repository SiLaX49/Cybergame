import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { buildContent, listContentFiles } from './build-content'

const ID_VIRTUEL = 'virtual:content'
const ID_RESOLU = '\0' + ID_VIRTUEL

/** Expose le contenu validé via `import contenu from 'virtual:content'`.
 *  En dev, modifier un YAML recharge la page ; ajouter un fichier demande de relancer `npm run dev`. */
export function contentPlugin(dossier = resolve(process.cwd(), 'content')): Plugin {
  // Brouillons (missions sensibles à relire) : en dev et pour les e2e (VITE_BROUILLONS=1), jamais au déploiement.
  let brouillons = true
  return {
    name: 'cyber-reflexes-contenu',
    configResolved(config) {
      brouillons = config.command === 'serve' || process.env.VITE_BROUILLONS === '1'
    },
    resolveId(id) {
      return id === ID_VIRTUEL ? ID_RESOLU : undefined
    },
    load(id) {
      if (id !== ID_RESOLU) return undefined
      for (const fichier of listContentFiles(dossier)) this.addWatchFile(fichier)
      return `export default ${JSON.stringify(buildContent(dossier, { brouillons }))}`
    },
  }
}
