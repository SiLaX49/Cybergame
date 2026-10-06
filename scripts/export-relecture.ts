import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { Etape, Leviers, Minijeu, Mission } from '../src/content/schema'
import { buildContent } from './build-content'

const QUALITES = { bon: 'bon', risque: 'risqué', aide: 'aide' } as const

const citation = (t: string) => t.split('\n').map((l) => `> ${l}`).join('\n')

function minijeuEnMarkdown(e: Minijeu): string[] {
  const l = [`### Mini-jeu « ${e.jeu} » (${e.id})`, '']
  if (e.jeu === 'tri') {
    const { consigne, categories, cartes } = e.config
    l.push(`Consigne : ${consigne}`, '', `Catégories : ${categories.map((c) => `${c.id} (${c.libelle})`).join(', ')}`, '')
    for (const c of cartes) l.push(`- « ${c.texte} » → ${c.categorie} : ${c.explication}`)
  } else if (e.jeu === 'repere') {
    const { consigne, titre, lignes } = e.config
    l.push(`Consigne : ${consigne}`, '', `Document : ${titre}`, '')
    for (const x of lignes) l.push(`- ${x.indice ? '[indice] ' : ''}« ${x.texte} »${x.explication ? ` : ${x.explication}` : ''}`)
  } else {
    l.push('```json', JSON.stringify(e.config, null, 2), '```')
  }
  return [...l, '']
}

function etapeEnMarkdown(e: Etape, leviers: Leviers): string[] {
  if (e.type === 'minijeu') return minijeuEnMarkdown(e)
  if (e.type === 'fil') {
    return [
      `### Fil de notifications (${e.id})`,
      '',
      e.consigne,
      '',
      ...e.notifications.map((n) => `- ${n.appNom}, ${n.de} : « ${n.texte} »${n.surprise ? ' [surprise]' : ''} : ${n.explication}`),
      '',
    ]
  }
  const l: string[] = []
  const levierLibelle = (id: string) => (id === 'autre' ? leviers.autre.libelle : (leviers.leviers[id as keyof Leviers['leviers']]?.libelle ?? id))
  if (e.type === 'scenario') {
    l.push(`### Scénario ${e.id}${e.role ? ` (rôle : ${e.role})` : ''}`, '')
    l.push(`Faux écran : ${e.ecran.appNom} (${e.ecran.app}), contact « ${e.ecran.contact} »${e.ecran.sujet ? `, sujet « ${e.ecran.sujet} »` : ''}`, '')
    for (const m of e.ecran.messages) {
      l.push(citation(`**${m.de === 'moi' ? 'Moi' : e.ecran.contact}** : ${m.texte}`), '')
      if (m.texteSimple) l.push(citation(`(simplifié) ${m.texteSimple}`), '')
    }
    l.push(`**Question** : ${e.question}`, '', '**Choix**', '')
    for (const c of e.choix) {
      l.push(`- (${QUALITES[c.qualite]}) ${c.texte}`, `  - Conséquence : ${c.consequence}`)
      if (c.consequenceSimple) l.push(`  - Conséquence (simplifiée) : ${c.consequenceSimple}`)
    }
    l.push('', '**Indices**', '', ...e.indices.map((i) => `- ${i.pertinent ? '[pertinent]' : '[non pertinent]'} ${i.libelle}`), '', `Explication des indices : ${e.explicationIndices}`, '')
  } else {
    l.push(`### Lieu ${e.id} : ${e.lieu} (${e.decor})`, '', e.guide, '')
    if (e.guideSimple) l.push(`Guide (simplifié) : ${e.guideSimple}`, '')
    l.push(`**Question** : ${e.question}`, '', '**Choix**', '')
    for (const c of e.choix) {
      l.push(`- (${QUALITES[c.qualite]}) ${c.texte}`, `  - Réaction : ${c.reaction}`)
      if (c.reactionSimple) l.push(`  - Réaction (simplifiée) : ${c.reactionSimple}`)
    }
    l.push('')
  }
  l.push(`**À retenir** : ${e.aRetenir}`)
  if (e.aRetenirSimple) l.push('', `**À retenir (simplifié)** : ${e.aRetenirSimple}`)
  l.push('')
  if (e.pourquoi?.length) {
    l.push('**Leviers**', '')
    for (const p of e.pourquoi) l.push(`- ${levierLibelle(p.levier)} (${p.levier}) ; truc : ${p.truc} ; parade : ${p.parade}`)
    l.push('')
  }
  if (e.recuperation) l.push(`**Récupération** : ${e.recuperation.action}, si choix ${e.recuperation.siChoix.join(', ')}`, '')
  return l
}

/** Une mission au format Markdown, pour la relecture par un adulte (ton, sensibilité, exactitude). */
export function missionEnMarkdown(mission: Mission, leviers: Leviers): string {
  const r = mission.relecture
  const l: string[] = [
    `# ${mission.titre}`,
    '',
    `- Identifiant : ${mission.id}`,
    `- Thème : ${mission.theme ?? 'aucun'}`,
    `- Niveau : ${mission.tranches.join(', ')}`,
    `- Durée : ${mission.duree} min`,
    `- Statut de relecture : ${r ? `${r.statut}${r.par ? ` (par ${r.par}${r.date ? `, ${r.date}` : ''})` : ''}` : 'aucun'}`,
    '',
    mission.resume,
    '',
    '## Objectifs',
    '',
    ...mission.objectifs.map((o) => `- ${o}`),
    '',
    '## Étapes',
    '',
    ...mission.etapes.flatMap((e) => etapeEnMarkdown(e, leviers)),
    '## Débrief',
    '',
    ...mission.debrief.questions.map((q, i) => `${i + 1}. ${q}`),
    '',
    `Réponses : ${mission.debrief.reponses}`,
    '',
    '**Erreurs fréquentes**',
    '',
    ...mission.debrief.erreursFrequentes.map((x) => `- ${x}`),
    '',
    '## Fiche enseignant',
    '',
    `**Déroulement** : ${mission.fiche.deroulement}`,
    '',
    `**Si un élève révèle** : ${mission.fiche.siRevelation ?? '(non renseigné)'}`,
    '',
  ]
  return l.join('\n')
}

function main() {
  const racineProjet = fileURLToPath(new URL('..', import.meta.url))
  const sortie = join(racineProjet, 'dist-relecture')
  const bundle = buildContent(join(racineProjet, 'content'), { brouillons: true })
  const sensibles = new Set(bundle.themes.filter((t) => t.sensible).map((t) => t.id))
  const toutes = process.argv.includes('--toutes')
  const missions = bundle.missions.filter((m) => m.type === 'mission' && (toutes || (m.theme && sensibles.has(m.theme))))
  rmSync(sortie, { recursive: true, force: true })
  mkdirSync(sortie, { recursive: true })
  for (const m of missions) writeFileSync(join(sortie, `${m.id}.md`), missionEnMarkdown(m, bundle.leviers), 'utf-8')
  console.log(`${missions.length} mission(s) exportée(s) dans dist-relecture/`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
