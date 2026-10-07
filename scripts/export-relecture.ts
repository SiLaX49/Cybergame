import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { Aide, Etape, LevierId, Leviers, Lieu, Minijeu, Mission, Scenario, Theme } from '../src/content/schema'
import { BADGES, descriptionBadge, type BadgeId } from '../src/engine/badges'
import { AVERTISSEMENT, FIN_SENSIBLE, PASSER, TITRE_RECUPERATION_VICTIME, TITRE_REPONSE_SENSIBLE } from '../src/mission/textesSensibles'
import { contexteSensible, texteRecuperation } from '../src/recovery/textes'
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

const TYPES_AIDE: Record<Aide['type'], string> = {
  humaine: 'Parler à quelqu’un',
  urgence: 'Urgence',
  signalement: 'Signaler un contenu',
  technique: 'Aide technique',
}

/** Leviers des blocs « pourquoi » de la mission, dans l’ordre d’apparition, sans doublon. */
function leviersUtilises(mission: Mission): LevierId[] {
  const vus: LevierId[] = []
  for (const e of mission.etapes) {
    if (e.type !== 'scenario' && e.type !== 'lieu') continue
    for (const p of e.pourquoi ?? []) if (!vus.includes(p.levier)) vus.push(p.levier)
  }
  return vus
}

/**
 * Annexe : tout ce que l’élève lit autour des étapes (avertissement, aides, gestes de récupération,
 * réponses aux leviers, fin de mission), pour que la relecture porte sur le texte exact affiché.
 */
function annexeEnMarkdown(mission: Mission, leviers: Leviers, theme: Theme | undefined): string[] {
  const sensible = !!theme?.sensible
  const contexte = sensible ? contexteSensible(theme?.id) : undefined
  const l: string[] = ['## Annexe : textes affichés autour des étapes', '']
  if (sensible && theme) {
    l.push('### Avertissement avant la mission', '', `**${AVERTISSEMENT.titre}**`, '', ...AVERTISSEMENT.paragraphes.flatMap((p) => [p, '']))
    l.push(`Boutons : ${AVERTISSEMENT.commencer} / ${AVERTISSEMENT.revenir}. Pendant la mission : « ${PASSER.scenario} » ou « ${PASSER.lieu} », sans pénalité.`, '')
    l.push('### Bandeau d’aide (permanent pendant la mission)', '', ...theme.aides.map((a) => `- ${TYPES_AIDE[a.type]} : ${a.numero} : ${a.libelle}`), '')
  }
  const avecRecuperation = mission.etapes.filter((e): e is Scenario | Lieu => (e.type === 'scenario' || e.type === 'lieu') && !!e.recuperation)
  if (avecRecuperation.length) {
    l.push('### Gestes de récupération', '')
    for (const e of avecRecuperation) {
      const titre = e.type === 'scenario' && e.role === 'victime' ? TITRE_RECUPERATION_VICTIME : 'Maintenant, limite les dégâts'
      l.push(`- ${e.id} : ${e.recuperation!.action}, titre de l’étape « ${titre} »`)
    }
    l.push('')
    for (const action of new Set(avecRecuperation.map((e) => e.recuperation!.action))) {
      const lignes = texteRecuperation(action, contexte)
      l.push(`#### ${action}`, '', ...(lignes ?? [`(texte dans src/recovery/, action non sensible)`]), '')
    }
  }
  const ids = leviersUtilises(mission)
  if (ids.length) {
    const autre = sensible ? leviers.autreSensible : leviers.autre
    l.push('### Leviers proposés (« pourquoi ») et parades générales', '')
    l.push(`Titre du bloc de réponse : « ${sensible ? TITRE_REPONSE_SENSIBLE : 'Ce qui a marché sur toi'} »`, '')
    l.push(...ids.map((id) => `- ${leviers.leviers[id].libelle} : ${leviers.leviers[id].parade}`))
    l.push(`- ${leviers.autre.libelle} : truc : ${autre.truc} ; parade : ${autre.parade}`, '')
  }
  if (sensible) {
    l.push('### Fin de mission', '', `Titre du bloc des leviers : « ${FIN_SENSIBLE.titre} »`, '', `Sans levier choisi : « ${FIN_SENSIBLE.sansLevier} »`, '')
    const badges = (Object.keys(BADGES) as BadgeId[]).filter((b) => b !== 'vigilant' && (b !== 'explorateur' || mission.format === 'parcours'))
    l.push('Badges possibles :', '', ...badges.map((b) => `- ${BADGES[b].titre} : ${descriptionBadge(b, true)}`), '')
  }
  return l
}

/** Une mission au format Markdown, pour la relecture par un adulte (ton, sensibilité, exactitude). */
export function missionEnMarkdown(mission: Mission, leviers: Leviers, theme?: Theme): string {
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
    ...annexeEnMarkdown(mission, leviers, theme),
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
  for (const m of missions) writeFileSync(join(sortie, `${m.id}.md`), missionEnMarkdown(m, bundle.leviers, bundle.themes.find((t) => t.id === m.theme)), 'utf-8')
  console.log(`${missions.length} mission(s) exportée(s) dans dist-relecture/`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
