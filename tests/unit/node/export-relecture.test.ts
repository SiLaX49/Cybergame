// @vitest-environment node
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildContent } from '../../../scripts/build-content'
import { missionEnMarkdown } from '../../../scripts/export-relecture'

const bundle = buildContent(join(process.cwd(), 'content'))
const mission = bundle.missions.find((m) => m.type === 'mission' && m.etapes.some((e) => e.type === 'scenario'))

describe('export pour la relecture', () => {
  it('produit le titre, chaque question, chaque choix et la consigne « Si un élève révèle »', () => {
    if (!mission) throw new Error('aucune mission de test')
    const md = missionEnMarkdown({ ...mission, fiche: { ...mission.fiche, siRevelation: 'Écouter sans promettre le secret.' } }, bundle.leviers)
    expect(md).toContain(mission.titre)
    expect(md).toContain('Si un élève révèle')
    for (const e of mission.etapes) {
      if (e.type !== 'scenario' && e.type !== 'lieu') continue
      expect(md).toContain(e.question)
      for (const c of e.choix) expect(md).toContain(c.texte)
    }
  })
})
