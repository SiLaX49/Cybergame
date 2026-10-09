// @vitest-environment node
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildContent } from '../../../scripts/build-content'
import type { Mission, Scenario } from '../../../src/content/schema'
import { missionEnMarkdown } from '../../../scripts/export-relecture'
import { descriptionBadge } from '../../../src/engine/badges'
import { leviersDeLaMission } from '../../../src/engine/mission-runner'
import { AVERTISSEMENT, FIN_SENSIBLE, TITRE_RECUPERATION_VICTIME, TITRE_REPONSE_SENSIBLE } from '../../../src/mission/textesSensibles'
import { SOUTENIR, texteRecuperation } from '../../../src/recovery/textes'

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

describe('export pour la relecture : annexe des thèmes sensibles', () => {
  const md = (id: string) => {
    const m = bundle.missions.find((x) => x.id === id)
    if (!m) throw new Error(`mission absente : ${id}`)
    return { m, texte: missionEnMarkdown(m, bundle.leviers, bundle.themes.find((t) => t.id === m.theme)) }
  }

  it('numéros d’aide du thème, avertissement et textes de fin de mission', () => {
    const { m, texte } = md('r-6e-ami-du-jeu')
    const theme = bundle.themes.find((t) => t.id === m.theme)!
    expect(texte).toContain('## Annexe')
    for (const a of theme.aides) expect(texte).toContain(`${a.numero} : ${a.libelle}`)
    for (const p of AVERTISSEMENT.paragraphes) expect(texte).toContain(p)
    expect(texte).toContain(FIN_SENSIBLE.titre)
    expect(texte).toContain(FIN_SENSIBLE.sansLevier)
    expect(texte).toContain(TITRE_REPONSE_SENSIBLE)
    expect(texte).toContain(descriptionBadge('oeil-de-lynx', true))
  })

  it('texte complet de chaque geste de récupération utilisé, dans le contexte du thème', () => {
    const { m, texte } = md('r-6e-ami-du-jeu')
    const actions = new Set(m.etapes.flatMap((e) => (e.type === 'scenario' && e.recuperation ? [e.recuperation.action] : [])))
    expect(actions.size).toBeGreaterThan(0)
    for (const a of actions) for (const ligne of texteRecuperation(a, 'rencontres')!) expect(texte, a).toContain(ligne)
    expect(texte).toContain(SOUTENIR.rencontres.rappel)
    expect(texte).not.toContain(SOUTENIR.harcelement.rappel)
    const h = md('h-6e-surnom').texte
    expect(h).toContain(SOUTENIR.harcelement.rappel)
    expect(h).toContain(TITRE_RECUPERATION_VICTIME)
  })

  it('leviers utilisés avec libellé et parade, et la réponse « Autre chose » sensible', () => {
    const { m, texte } = md('h-6e-surnom')
    for (const id of leviersDeLaMission(m)) expect(texte).toContain(`${bundle.leviers.leviers[id].libelle} : ${bundle.leviers.leviers[id].parade}`)
    expect(texte).toContain(bundle.leviers.autreSensible.truc)
    expect(texte).toContain(bundle.leviers.autreSensible.parade)
    expect(texte).not.toContain(bundle.leviers.autre.truc)
  })

  it('mission non sensible : pas d’annexe sensible, « Autre chose » générique', () => {
    const m = bundle.missions.find((x) => x.id === 'p-6e-colis')!
    const texte = missionEnMarkdown(m, bundle.leviers, bundle.themes.find((t) => t.id === m.theme))
    expect(texte).not.toContain(AVERTISSEMENT.paragraphes[0])
    expect(texte).not.toContain(FIN_SENSIBLE.titre)
    expect(texte).toContain(bundle.leviers.autre.truc)
  })

  it('mini-jeux, récupérations et blocs « pourquoi » des étapes', () => {
    const { m, texte } = md('h-6e-surnom')
    for (const e of m.etapes) {
      if (e.type === 'minijeu' && e.jeu === 'tri') for (const c of e.config.cartes) expect(texte).toContain(`« ${c.texte} » → ${c.categorie} : ${c.explication}`)
      if (e.type !== 'scenario') continue
      if (e.recuperation) expect(texte).toContain(`**Récupération** : ${e.recuperation.action}, si choix ${e.recuperation.siChoix.join(', ')}`)
      for (const p of e.pourquoi ?? []) expect(texte).toContain(`truc : ${p.truc} ; parade : ${p.parade}`)
    }
    const r = md('r-college-chantage')
    for (const e of r.m.etapes) {
      if (e.type === 'minijeu' && e.jeu === 'repere') for (const l of e.config.lignes) expect(r.texte).toContain(`« ${l.texte} »`)
    }
    const mdp = bundle.missions.find((x) => x.etapes.some((e) => e.type === 'minijeu' && e.jeu === 'motdepasse'))!
    expect(missionEnMarkdown(mdp, bundle.leviers)).toContain('```json')
  })
})

describe('export pour la relecture : tout le texte lu du téléphone', () => {
  /** Textes du nouveau schéma que l’élève lit : bulle envoyée, réaction du contact, champs propres à chaque appli. */
  const textesDuTelephone = (s: Scenario): string[] => {
    const e = s.ecran
    const t = [e.notification, ...e.messages.flatMap((m) => [m.apercu?.titre, m.apercu?.domaine])]
    if (e.app === 'mail') t.push(e.sujet, e.adresse, e.pieceJointe?.nom)
    if (e.app === 'web') t.push(...(e.boutons ?? []))
    if (e.app === 'social') {
      t.push(e.bio, e.media?.description, e.media?.descriptionSimple, ...(e.commentaires ?? []).flatMap((c) => [c.de, c.texte, c.texteSimple]))
    }
    t.push(...s.choix.flatMap((c) => [c.reponse, c.reponseSimple, c.reaction, c.reactionSimple]))
    return t.filter((x): x is string => !!x)
  }
  const absents = (m: Mission) => {
    const md = missionEnMarkdown(m, bundle.leviers, bundle.themes.find((t) => t.id === m.theme))
    return m.etapes.flatMap((e) => (e.type === 'scenario' ? textesDuTelephone(e).filter((x) => !md.includes(x)).map((x) => `${m.id}.${e.id} : ${x}`) : []))
  }

  it('contenu réel : chaque réaction, bulle envoyée, commentaire, média et champ d’écran figure dans l’export', () => {
    const scenarios = bundle.missions.flatMap((m) => m.etapes.filter((e) => e.type === 'scenario'))
    expect(scenarios.some((s) => s.choix.some((c) => c.reaction))).toBe(true)
    expect(bundle.missions.flatMap(absents)).toEqual([])
  })

  it('champs encore absents du contenu (notification, aperçu, pièce jointe, boutons) : exportés aussi', () => {
    const base = bundle.missions.find((x) => x.id === 'r-lycee-webcam')!
    const scenario = base.etapes.find((e): e is Scenario => e.type === 'scenario')!
    const message = { ...scenario.ecran.messages[0]!, apercu: { titre: 'Titre de l’aperçu', domaine: 'apercu.example' } }
    const ecrans: Scenario['ecran'][] = [
      { app: 'mail', appNom: 'Mail', contact: 'X', messages: [message], notification: 'Texte de notification', pieceJointe: { nom: 'piece-jointe.pdf' } },
      { app: 'web', appNom: 'Navigateur', contact: 'X', messages: [message], boutons: ['Bouton A', 'Bouton B'] },
    ]
    for (const ecran of ecrans) {
      const m: Mission = { ...base, etapes: [{ ...scenario, ecran, choix: scenario.choix.map((c) => ({ ...c, reactionSimple: 'Réaction simplifiée' })) }] }
      expect(absents(m)).toEqual([])
    }
  })
})
