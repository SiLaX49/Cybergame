// @vitest-environment node
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildContent } from '../../../scripts/build-content'
import { TRANCHES, type Mission } from '../../../src/content/schema'

const bundle = buildContent(join(process.cwd(), 'content'))
const missions = bundle.missions.filter((m) => m.type === 'mission')

const MARQUES_REELLES = [
  'snapchat', 'instagram', 'tiktok', 'roblox', 'robux', 'discord', 'fortnite', 'v-bucks', 'vinted', 'leboncoin',
  'la poste', 'colissimo', 'chronopost', 'amazon', 'whatsapp', 'facebook', 'youtube', 'paypal', 'iphone',
  'playstation', 'xbox', 'nintendo', 'telegram', 'vestiaire', 'steam', 'twitch', 'google', 'apple', 'pronote',
]

/** Numéros réservés à la fiction par l’ARCEP : mobile 06 39 98 xx xx, fixe 01 99 00 xx xx. */
const NUMERO = /(?:\+33\s?|\b0)[1-9](?:[\s.]?\d{2}){4}\b/g
const NUMERO_FICTIF = /^(?:\+33\s?|0)(?:6\s?39\s?98|1\s?99\s?00)/

/** Textes lus par l’élève qui n’ont pas de version simplifiée. */
function textesSansVersionSimple(m: Mission): [string, string][] {
  return m.etapes.flatMap((e): [string, string][] => {
    if (e.type === 'scenario') {
      return [
        [`${e.id}.question`, e.question],
        [`${e.id}.explicationIndices`, e.explicationIndices],
        ...e.choix.map((c): [string, string] => [`${e.id}.${c.id}.texte`, c.texte]),
        ...e.choix.filter((c) => !c.consequenceSimple).map((c): [string, string] => [`${e.id}.${c.id}.consequence`, c.consequence]),
        ...e.indices.map((i): [string, string] => [`${e.id}.${i.id}`, i.libelle]),
        ...(e.pourquoi ?? []).flatMap((p): [string, string][] => [
          [`${e.id}.pourquoi.${p.levier}.truc`, p.truc],
          [`${e.id}.pourquoi.${p.levier}.parade`, p.parade],
        ]),
      ]
    }
    if (e.type === 'fil') return e.notifications.map((n): [string, string] => [`${e.id}.${n.id}.explication`, n.explication])
    if (e.jeu === 'tri') return e.config.cartes.map((c): [string, string] => [`${e.id}.${c.id}.explication`, c.explication])
    if (e.jeu === 'motdepasse') return [[`${e.id}.contexte`, e.config.contexte]]
    if (e.jeu === 'confidentialite') return e.config.reglages.map((r): [string, string] => [`${e.id}.${r.id}`, r.explication])
    if (e.jeu === 'verification')
      return [[`${e.id}.explication`, e.config.explication], ...e.config.actions.map((a): [string, string] => [`${e.id}.${a.id}`, a.resultat])]
    if (e.jeu === 'permissions')
      return e.config.apps.flatMap((a) => a.permissions.map((p): [string, string] => [`${e.id}.${a.id}.${p.id}`, p.explication]))
    return e.config.lignes.map((l): [string, string] => [`${e.id}.${l.id}.explication`, l.explication ?? ''])
  })
}
const phrases = (texte: string) => texte.split(/(?<=[.!?…])\s+/).filter(Boolean)
const mots = (phrase: string) => phrase.split(/\s+/).filter((m) => /[\p{L}\d]/u.test(m))

function textesDesFauxEcrans(m: Mission): string[] {
  return m.etapes.flatMap((e) => {
    if (e.type === 'scenario') {
      const { appNom, contact, sujet, url, messages } = e.ecran
      return [appNom, contact, sujet ?? '', url ?? '', ...messages.flatMap((x) => [x.texte, x.texteSimple ?? ''])]
    }
    if (e.type === 'fil') return e.notifications.flatMap((n) => [n.appNom, n.de, n.texte])
    if (e.jeu === 'tri') return e.config.cartes.map((c) => c.texte)
    if (e.jeu === 'motdepasse') return [e.config.contexte]
    if (e.jeu === 'confidentialite') return [e.config.appNom, ...e.config.reglages.flatMap((r) => [r.libelle, ...r.options.map((o) => o.libelle)])]
    if (e.jeu === 'verification') return [e.config.publication.auteur, e.config.publication.texte, e.config.publication.image?.description ?? '']
    if (e.jeu === 'permissions') return e.config.apps.flatMap((a) => [a.nom, a.description, ...a.permissions.map((p) => p.libelle)])
    return [e.config.titre, ...e.config.lignes.map((l) => l.texte)]
  })
}

/** Comparaison des citations : casse et espaces (dont insécables) ignorées. */
const aplatir = (t: string) => t.toLowerCase().replace(/\s+/gu, ' ')

const missionsDuTheme = (theme: string) => missions.filter((m) => m.theme === theme)

describe('contenu réel', () => {
  it.each(bundle.missions.map((m) => [m.id, m] as const))('%s : aucune marque réelle dans les faux écrans', (_id, m) => {
    const texte = textesDesFauxEcrans(m).join(' ').toLowerCase()
    expect(MARQUES_REELLES.filter((marque) => new RegExp(`\\b${marque}\\b`).test(texte))).toEqual([])
  })

  it.each(bundle.missions.map((m) => [m.id, m] as const))('%s : chaque scénario a son bloc « pourquoi »', (_id, m) => {
    for (const e of m.etapes) {
      if (e.type !== 'scenario') continue
      expect(e.pourquoi?.length ?? 0, e.id).toBeGreaterThanOrEqual(3)
    }
  })

  it.each(bundle.missions.map((m) => [m.id, m] as const))('%s : aucune marque réelle dans les réponses « pourquoi »', (_id, m) => {
    const texte = m.etapes
      .flatMap((e) => (e.type === 'scenario' ? (e.pourquoi ?? []).flatMap((p) => [p.truc, p.parade]) : []))
      .join(' ')
      .toLowerCase()
    expect(MARQUES_REELLES.filter((marque) => new RegExp(`\\b${marque}\\b`).test(texte))).toEqual([])
  })

  it.each(bundle.missions.map((m) => [m.id, m] as const))('%s : aucune marque réelle dans les questions et les choix', (_id, m) => {
    const texte = m.etapes
      .flatMap((e) => (e.type === 'scenario' ? [e.question, ...e.choix.map((c) => c.texte)] : []))
      .join(' ')
      .toLowerCase()
    expect(MARQUES_REELLES.filter((marque) => new RegExp(`\\b${marque}\\b`).test(texte))).toEqual([])
  })

  it.each(bundle.missions.map((m) => [m.id, m] as const))(
    '%s : chaque citation « … » d’un « truc » figure à l’écran (et dans la lecture simplifiée en 6e)',
    (_id, m) => {
      const absentes: string[] = []
      for (const e of m.etapes) {
        if (e.type !== 'scenario') continue
        const { appNom, contact, sujet, url, messages } = e.ecran
        const commun = [appNom, contact, sujet ?? '', url ?? '', e.question]
        const normal = aplatir([...commun, ...messages.map((x) => x.texte)].join(' '))
        const simple = aplatir([...commun, ...messages.map((x) => x.texteSimple ?? x.texte)].join(' '))
        for (const p of e.pourquoi ?? []) {
          for (const [, citation] of p.truc.matchAll(/«\s*([^»]+?)\s*»/g)) {
            const c = aplatir(citation!)
            if (!normal.includes(c)) absentes.push(`${e.id}.${p.levier} : « ${citation} » absent de l’écran`)
            else if (m.tranches.includes('6e') && !simple.includes(c)) {
              absentes.push(`${e.id}.${p.levier} : « ${citation} » absent de la lecture simplifiée`)
            }
          }
        }
      }
      expect(absentes).toEqual([])
    },
  )

  it('le choix risqué n’est pas le plus long dans plus d’un tiers des scénarios', () => {
    const scenarios = bundle.missions.flatMap((m) => m.etapes.filter((e) => e.type === 'scenario'))
    const plusLong = scenarios.filter((s) => {
      const risque = s.choix.find((c) => c.qualite === 'risque')
      if (!risque) return false
      const n = mots(risque.texte).length
      return s.choix.every((c) => c === risque || mots(c.texte).length < n)
    })
    expect(plusLong.length, plusLong.map((s) => s.id).join(', ')).toBeLessThanOrEqual(Math.floor(scenarios.length / 3))
  })

  it('leviers.yaml : phrases de 20 mots maximum', () => {
    const textes = [
      ...Object.values(bundle.leviers.leviers).flatMap((l) => [l.libelle, l.parade]),
      bundle.leviers.autre.libelle,
      bundle.leviers.autre.truc,
      bundle.leviers.autre.parade,
    ]
    expect(textes.flatMap(phrases).filter((p) => mots(p).length > 20)).toEqual([])
  })

  it.each(bundle.missions.map((m) => [m.id, m] as const))('%s : numéros de téléphone fictifs (ARCEP)', (_id, m) => {
    const numeros = textesDesFauxEcrans(m).flatMap((t) => t.match(NUMERO) ?? [])
    expect(numeros.filter((n) => !NUMERO_FICTIF.test(n))).toEqual([])
  })

  it.each(bundle.missions.map((m) => [m.id, m] as const))('%s : une espace après chaque point', (_id, m) => {
    const texte = JSON.stringify(m)
    expect(texte.match(/\p{Ll}{2}\.\p{Lu}\p{Ll}/gu) ?? []).toEqual([])
  })

  it.each(bundle.missions.filter((m) => m.tranches.includes('6e')).map((m) => [m.id, m] as const))(
    '%s (6e) : pas de phrase de plus de 20 mots sans version simplifiée',
    (_id, m) => {
      const tropLongues = textesSansVersionSimple(m).flatMap(([ou, t]) =>
        phrases(t)
          .filter((p) => mots(p).length > 20)
          .map((p) => `${ou} (${mots(p).length} mots) : ${p}`),
      )
      expect(tropLongues).toEqual([])
    },
  )

  it.each(missions.map((m) => [m.id, m] as const))('%s : 3 ou 4 scénarios et 1 mini-jeu', (_id, m) => {
    const scenarios = m.etapes.filter((e) => e.type === 'scenario')
    expect(scenarios.length).toBeGreaterThanOrEqual(3)
    expect(scenarios.length).toBeLessThanOrEqual(4)
    expect(m.etapes.filter((e) => e.type === 'minijeu')).toHaveLength(1)
    expect(scenarios.filter((s) => s.type === 'scenario' && s.recuperation).length).toBeGreaterThanOrEqual(2)
  })

  it.each(missions.filter((m) => m.tranches.includes('6e')).map((m) => [m.id, m] as const))(
    '%s (6e) : textes simplifiés présents',
    (_id, m) => {
      for (const e of m.etapes) {
        if (e.type !== 'scenario') continue
        expect(e.aRetenirSimple, `${e.id}.aRetenirSimple`).toBeTruthy()
        e.ecran.messages.forEach((msg, i) => expect(msg.texteSimple, `${e.id}.messages.${i}`).toBeTruthy())
        e.choix
          .filter((c) => c.qualite === 'risque')
          .forEach((c) => expect(c.consequenceSimple, `${e.id}.${c.id}`).toBeTruthy())
      }
    },
  )

  it.each(TRANCHES)('phishing : au moins une mission pour la tranche %s', (t) => {
    expect(missionsDuTheme('phishing').some((m) => m.tranches.includes(t))).toBe(true)
  })

  it.each(TRANCHES)('jeux et achats : au moins une mission pour la tranche %s', (t) => {
    expect(missionsDuTheme('jeux-achats').some((m) => m.tranches.includes(t))).toBe(true)
  })

  it.each(TRANCHES)('rappel : exactement une mission rappel pour la tranche %s', (t) => {
    expect(bundle.missions.filter((m) => m.type === 'rappel' && m.tranches.includes(t))).toHaveLength(1)
  })

  const MINIJEU_DU_THEME = { comptes: 'motdepasse', 'vie-privee': 'confidentialite', desinformation: 'verification', appareils: 'permissions' } as const

  it.each(Object.keys(MINIJEU_DU_THEME).flatMap((theme) => TRANCHES.map((t) => [theme, t] as const)))(
    '%s : au moins une mission pour la tranche %s',
    (theme, t) => {
      expect(missionsDuTheme(theme).some((m) => m.tranches.includes(t))).toBe(true)
    },
  )

  it.each(Object.entries(MINIJEU_DU_THEME))('%s : chaque mission utilise le mini-jeu « %s »', (theme, jeu) => {
    for (const m of missionsDuTheme(theme)) {
      const minijeu = m.etapes.find((e) => e.type === 'minijeu')
      expect(minijeu?.type === 'minijeu' ? minijeu.jeu : null, m.id).toBe(jeu)
    }
  })

  it.each(Object.keys(MINIJEU_DU_THEME))('%s : bon et risque ne sont pas le choix le plus long dans plus d’un tiers des scénarios', (theme) => {
    const scenarios = missionsDuTheme(theme).flatMap((m) => m.etapes.filter((e) => e.type === 'scenario'))
    for (const qualite of ['bon', 'risque'] as const) {
      const plusLong = scenarios.filter((s) => {
        const cible = s.choix.find((c) => c.qualite === qualite)
        if (!cible) return false
        const n = mots(cible.texte).length
        return s.choix.every((c) => c === cible || mots(c.texte).length < n)
      })
      expect(plusLong.length, `${qualite} : ${plusLong.map((s) => s.id).join(', ')}`).toBeLessThanOrEqual(Math.floor(scenarios.length / 3))
    }
  })

  it('les rappels sont courts et contiennent un fil d’au moins 4 notifications', () => {
    const rappels = bundle.missions.filter((m) => m.type === 'rappel')
    expect(rappels.length).toBeGreaterThan(0)
    for (const r of rappels) {
      expect(r.duree, r.id).toBeLessThanOrEqual(8)
      const fil = r.etapes.find((e) => e.type === 'fil')
      expect(fil?.type === 'fil' ? fil.notifications.length : 0, r.id).toBeGreaterThanOrEqual(4)
    }
  })
})
